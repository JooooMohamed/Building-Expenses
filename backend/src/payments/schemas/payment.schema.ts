import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema()
export class PaymentApplication {
  @Prop({ type: Types.ObjectId, ref: 'ExpenseShare', required: true })
  expenseShareId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;
}

@Schema()
export class GatewayDetails {
  @Prop()
  provider: string;

  @Prop()
  transactionId: string;

  @Prop()
  authCode: string;

  @Prop()
  responseCode: string;
}

@Schema()
export class CashDetails {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy: Types.ObjectId;

  @Prop()
  receiptNumber: string;
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  residentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Unit', required: true })
  unitId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'TRY' })
  currency: string;

  @Prop({ required: true, enum: ['cash', 'online', 'bank_transfer'] })
  method: string;

  @Prop({ enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' })
  status: string;

  @Prop({ type: [PaymentApplication], default: [] })
  appliedTo: PaymentApplication[];

  @Prop({ type: GatewayDetails })
  gateway?: GatewayDetails;

  @Prop({ type: CashDetails })
  cash?: CashDetails;

  @Prop()
  notes: string;

  @Prop({ required: true })
  paymentDate: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ buildingId: 1, residentId: 1, paymentDate: -1 });
PaymentSchema.index({ buildingId: 1, status: 1 });
