import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PaymentProvider,
  PaymentInitiation,
  PaymentResult,
} from './payment-provider.interface';

/**
 * Nestpay (EST / Asseco) payment gateway integration.
 * In production, this sends form POST data to the Nestpay 3D Secure page.
 * The gateway processes the payment and sends a server-to-server callback.
 */
@Injectable()
export class NestpayProvider implements PaymentProvider {
  readonly name = 'nestpay';
  private readonly logger = new Logger(NestpayProvider.name);

  private readonly clientId: string;
  private readonly storeKey: string;
  private readonly storeType: string;
  private readonly gatewayUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('NESTPAY_CLIENT_ID', '');
    this.storeKey = this.configService.get<string>('NESTPAY_STORE_KEY', '');
    this.storeType = this.configService.get<string>('NESTPAY_STORE_TYPE', '3d_pay');
    this.gatewayUrl = this.configService.get<string>(
      'NESTPAY_GATEWAY_URL',
      'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
    );
  }

  async createPayment(params: PaymentInitiation) {
    const rnd = Date.now().toString();
    const hashStr = [
      this.clientId,
      params.orderId,
      params.amount.toFixed(2),
      params.returnUrl,
      params.callbackUrl,
      'Auth', // transaction type
      '',     // installment
      rnd,
      this.storeKey,
    ].join('');

    const hash = crypto
      .createHash('sha512')
      .update(hashStr)
      .digest('base64');

    const formData: Record<string, string> = {
      clientid: this.clientId,
      storetype: this.storeType,
      hash: hash,
      islemtipi: 'Auth',
      amount: params.amount.toFixed(2),
      currency: this.getCurrencyCode(params.currency),
      oid: params.orderId,
      okUrl: params.returnUrl,
      failUrl: params.returnUrl,
      callbackUrl: params.callbackUrl,
      lang: 'en',
      rnd: rnd,
      email: params.customerEmail || '',
      BillToName: params.customerName || '',
    };

    return {
      paymentUrl: this.gatewayUrl,
      formData,
    };
  }

  async verifyCallback(payload: Record<string, string>): Promise<PaymentResult> {
    // Verify hash to prevent tampering
    const hashParamsStr = payload.HASHPARAMS || '';
    const hashParams = hashParamsStr.split(':').filter(Boolean);
    const hashValues = hashParams.map((p) => payload[p] || '').join('');
    const expectedHash = crypto
      .createHash('sha512')
      .update(hashValues + this.storeKey)
      .digest('base64');

    const receivedHash = payload.HASH || '';

    if (expectedHash !== receivedHash) {
      this.logger.warn(`Hash verification failed for order ${payload.oid}`);
      return {
        success: false,
        responseCode: 'HASH_MISMATCH',
        message: 'Hash verification failed',
        rawResponse: payload,
      };
    }

    const responseCode = payload.Response || payload.mdStatus || '';
    const success = responseCode === 'Approved' || payload.mdStatus === '1';

    return {
      success,
      transactionId: payload.TransId || payload.transid || '',
      authCode: payload.AuthCode || '',
      responseCode,
      message: payload.ErrMsg || (success ? 'Payment successful' : 'Payment failed'),
      rawResponse: payload,
    };
  }

  mapGatewayStatus(responseCode: string): 'completed' | 'failed' | 'pending' {
    if (responseCode === 'Approved' || responseCode === '1') return 'completed';
    if (responseCode === 'Declined' || responseCode === '0') return 'failed';
    return 'pending';
  }

  private getCurrencyCode(currency: string): string {
    const codes: Record<string, string> = {
      TRY: '949',
      USD: '840',
      EUR: '978',
      GBP: '826',
    };
    return codes[currency] || '949';
  }
}
