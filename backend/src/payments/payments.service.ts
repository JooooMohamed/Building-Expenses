import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { ExpenseShare, ExpenseShareDocument } from '../expenses/schemas/expense-share.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(ExpenseShare.name) private shareModel: Model<ExpenseShareDocument>,
  ) {}

  async recordCashPayment(
    buildingId: string,
    adminId: string,
    data: {
      residentId: string;
      unitId: string;
      amount: number;
      paymentDate: string;
      expenseShareIds: string[];
      notes?: string;
    },
  ) {
    // Create the payment record
    const receiptNumber = `R-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const payment = await this.paymentModel.create({
      buildingId: new Types.ObjectId(buildingId),
      residentId: new Types.ObjectId(data.residentId),
      unitId: new Types.ObjectId(data.unitId),
      amount: data.amount,
      method: 'cash',
      status: 'completed',
      paymentDate: new Date(data.paymentDate),
      notes: data.notes,
      cash: {
        recordedBy: new Types.ObjectId(adminId),
        receiptNumber,
      },
      appliedTo: [],
    });

    // Apply payment to expense shares (FIFO)
    let remaining = data.amount;
    const appliedTo: { expenseShareId: Types.ObjectId; amount: number }[] = [];

    for (const shareId of data.expenseShareIds) {
      if (remaining <= 0) break;

      const share = await this.shareModel.findById(shareId);
      if (!share) continue;

      const owed = share.amount - share.paidAmount;
      const applied = Math.min(remaining, owed);

      share.paidAmount += applied;
      share.status = share.paidAmount >= share.amount ? 'paid' : 'partial';
      await share.save();

      appliedTo.push({ expenseShareId: share._id as Types.ObjectId, amount: applied });
      remaining -= applied;
    }

    payment.appliedTo = appliedTo;
    await payment.save();

    return {
      paymentId: payment._id,
      receiptNumber,
      status: 'completed',
      appliedTo: appliedTo.map((a) => ({
        expenseShareId: a.expenseShareId,
        amount: a.amount,
      })),
    };
  }

  async getResidentPayments(residentId: string) {
    return this.paymentModel
      .find({ residentId: new Types.ObjectId(residentId) })
      .sort({ paymentDate: -1 })
      .exec();
  }

  async getAllPayments(buildingId: string, status?: string) {
    const filter: Record<string, unknown> = { buildingId: new Types.ObjectId(buildingId) };
    if (status) filter.status = status;
    return this.paymentModel
      .find(filter)
      .populate('residentId', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .exec();
  }

  async initiateOnlinePayment(
    buildingId: string,
    residentId: string,
    unitId: string,
    amount: number,
    expenseShareIds: string[],
  ) {
    // Create pending payment
    const payment = await this.paymentModel.create({
      buildingId: new Types.ObjectId(buildingId),
      residentId: new Types.ObjectId(residentId),
      unitId: new Types.ObjectId(unitId),
      amount,
      method: 'online',
      status: 'pending',
      paymentDate: new Date(),
      appliedTo: expenseShareIds.map((id) => ({
        expenseShareId: new Types.ObjectId(id),
        amount: 0, // will be filled on callback
      })),
    });

    // TODO: Integrate with Nestpay — generate payment form URL
    // For now, return a placeholder
    const paymentUrl = `https://payment-gateway.example.com/pay?orderId=${payment._id}`;

    return {
      paymentId: payment._id,
      paymentUrl,
      amount,
    };
  }

  async handlePaymentCallback(orderId: string, gatewayResponse: Record<string, string>) {
    const payment = await this.paymentModel.findById(orderId);
    if (!payment) return { success: false };

    const isSuccess = gatewayResponse.responseCode === '00';

    if (isSuccess) {
      payment.status = 'completed';
      payment.gateway = {
        provider: 'nestpay',
        transactionId: gatewayResponse.transactionId,
        authCode: gatewayResponse.authCode,
        responseCode: gatewayResponse.responseCode,
      };

      // Apply payment to shares
      let remaining = payment.amount;
      for (const application of payment.appliedTo) {
        const share = await this.shareModel.findById(application.expenseShareId);
        if (!share) continue;

        const owed = share.amount - share.paidAmount;
        const applied = Math.min(remaining, owed);

        share.paidAmount += applied;
        share.status = share.paidAmount >= share.amount ? 'paid' : 'partial';
        await share.save();

        application.amount = applied;
        remaining -= applied;
      }
    } else {
      payment.status = 'failed';
    }

    await payment.save();
    return { success: isSuccess, paymentId: payment._id };
  }
}
