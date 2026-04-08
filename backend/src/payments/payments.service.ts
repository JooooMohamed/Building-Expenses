import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { ExpenseShare, ExpenseShareDocument } from '../expenses/schemas/expense-share.schema';
import { NestpayProvider } from './providers/nestpay.provider';
import { BillingService } from '../billing/billing.service';
import { RecordCashPaymentDto, InitiatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private receiptCounter = 0;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(ExpenseShare.name) private shareModel: Model<ExpenseShareDocument>,
    private nestpayProvider: NestpayProvider,
    private billingService: BillingService,
    private configService: ConfigService,
  ) {}

  async recordCashPayment(
    buildingId: string,
    adminId: string,
    dto: RecordCashPaymentDto,
  ) {
    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Generate unique receipt number
    this.receiptCounter++;
    const receiptNumber = `R-${new Date().getFullYear()}-${Date.now()}-${this.receiptCounter}`;

    const payment = await this.paymentModel.create({
      buildingId: new Types.ObjectId(buildingId),
      residentId: new Types.ObjectId(dto.residentId),
      unitId: new Types.ObjectId(dto.unitId),
      amount: dto.amount,
      method: 'cash',
      status: 'completed',
      paymentDate: new Date(dto.paymentDate),
      notes: dto.notes,
      cash: {
        recordedBy: new Types.ObjectId(adminId),
        receiptNumber,
      },
      appliedTo: [],
    });

    // Apply payment to expense shares (FIFO)
    // If no specific share IDs provided, auto-find unpaid shares for this resident
    let shareIds = dto.expenseShareIds || [];
    if (shareIds.length === 0) {
      const unpaidShares = await this.shareModel
        .find({
          residentId: new Types.ObjectId(dto.residentId),
          status: { $in: ['unpaid', 'partial'] },
        })
        .sort({ dueDate: 1 })
        .exec();
      shareIds = unpaidShares.map((s) => s._id.toString());
    }

    let remaining = dto.amount;
    const appliedTo: { expenseShareId: Types.ObjectId; amount: number }[] = [];

    for (const shareId of shareIds) {
      if (remaining <= 0) break;

      const share = await this.shareModel.findById(shareId);
      if (!share) continue;

      const owed = share.amount - share.paidAmount;
      if (owed <= 0) continue;
      const applied = Math.min(remaining, owed);

      share.paidAmount += applied;
      share.status = share.paidAmount >= share.amount ? 'paid' : 'partial';
      await share.save();

      appliedTo.push({ expenseShareId: share._id as Types.ObjectId, amount: applied });
      remaining -= applied;
    }

    payment.appliedTo = appliedTo;
    await payment.save();

    // Also allocate in the new billing system
    await this.billingService.allocatePayment(
      buildingId,
      payment._id.toString(),
      dto.residentId,
      dto.amount,
    );

    return {
      paymentId: payment._id,
      receiptNumber,
      status: 'completed',
      appliedTo: appliedTo.map((a) => ({
        expenseShareId: a.expenseShareId,
        amount: a.amount,
      })),
      remainingCredit: remaining,
    };
  }

  async getResidentPayments(residentId: string, page = 1, limit = 20) {
    const filter = { residentId: new Types.ObjectId(residentId) };
    const [data, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getAllPayments(buildingId: string, options: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = options;
    const filter: Record<string, unknown> = { buildingId: new Types.ObjectId(buildingId) };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .populate('residentId', 'firstName lastName email')
        .populate('unitId', 'unitNumber')
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async initiateOnlinePayment(
    buildingId: string,
    residentId: string,
    dto: InitiatePaymentDto,
  ) {
    // Create pending payment
    const payment = await this.paymentModel.create({
      buildingId: new Types.ObjectId(buildingId),
      residentId: new Types.ObjectId(residentId),
      unitId: new Types.ObjectId(dto.unitId),
      amount: dto.amount,
      method: 'online',
      status: 'pending',
      paymentDate: new Date(),
      appliedTo: dto.expenseShareIds.map((id) => ({
        expenseShareId: new Types.ObjectId(id),
        amount: 0,
      })),
    });

    const apiBase = this.configService.get<string>('API_BASE_URL', 'http://localhost:3000/api/v1');

    // Generate payment form data via Nestpay
    const { paymentUrl, formData } = await this.nestpayProvider.createPayment({
      orderId: payment._id.toString(),
      amount: dto.amount,
      currency: 'TRY',
      description: `Building payment - ${residentId}`,
      returnUrl: `${apiBase}/payments/return`,
      callbackUrl: `${apiBase}/payments/callback`,
    });

    return {
      paymentId: payment._id,
      paymentUrl,
      formData,
      amount: dto.amount,
    };
  }

  /**
   * Handle payment gateway callback with idempotency.
   * Prevents duplicate processing of the same callback.
   */
  async handlePaymentCallback(orderId: string, gatewayResponse: Record<string, string>) {
    const payment = await this.paymentModel.findById(orderId);
    if (!payment) {
      this.logger.warn(`Payment callback for unknown order: ${orderId}`);
      return { success: false, message: 'Payment not found' };
    }

    // Idempotency: if already processed, return existing result
    if (payment.status === 'completed' || payment.status === 'failed') {
      this.logger.log(`Duplicate callback for order ${orderId}, status: ${payment.status}`);
      return { success: payment.status === 'completed', paymentId: payment._id, duplicate: true };
    }

    // Verify gateway response signature
    const result = await this.nestpayProvider.verifyCallback(gatewayResponse);

    if (result.success) {
      payment.status = 'completed';
      payment.gateway = {
        provider: 'nestpay',
        transactionId: result.transactionId || '',
        authCode: result.authCode || '',
        responseCode: result.responseCode,
      };

      // Apply payment to expense shares (FIFO)
      let remaining = payment.amount;
      for (const application of payment.appliedTo) {
        const share = await this.shareModel.findById(application.expenseShareId);
        if (!share) continue;

        const owed = share.amount - share.paidAmount;
        if (owed <= 0) continue;
        const applied = Math.min(remaining, owed);

        share.paidAmount += applied;
        share.status = share.paidAmount >= share.amount ? 'paid' : 'partial';
        await share.save();

        application.amount = applied;
        remaining -= applied;
      }

      // Also allocate in billing system
      await this.billingService.allocatePayment(
        payment.buildingId.toString(),
        payment._id.toString(),
        payment.residentId.toString(),
        payment.amount,
      );
    } else {
      payment.status = 'failed';
      payment.gateway = {
        provider: 'nestpay',
        transactionId: '',
        authCode: '',
        responseCode: result.responseCode,
      };
    }

    await payment.save();
    return { success: result.success, paymentId: payment._id };
  }
}
