export interface PaymentInitiation {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  callbackUrl: string;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  authCode?: string;
  responseCode: string;
  message: string;
  rawResponse?: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: string;

  /**
   * Create a payment request and return the URL/form data the client should redirect to.
   */
  createPayment(params: PaymentInitiation): Promise<{
    paymentUrl: string;
    formData?: Record<string, string>;
  }>;

  /**
   * Verify the gateway callback/webhook and extract payment result.
   * Must validate signatures to prevent tampering.
   */
  verifyCallback(payload: Record<string, string>): Promise<PaymentResult>;

  /**
   * Map gateway-specific status codes to our internal status.
   */
  mapGatewayStatus(responseCode: string): 'completed' | 'failed' | 'pending';
}
