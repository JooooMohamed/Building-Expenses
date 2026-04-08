import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentAllocationDocument = PaymentAllocation & Document;

@Schema({ timestamps: true })
export class PaymentAllocation {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true })
  paymentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ResidentCharge', required: true })
  chargeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  residentId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  allocatedAt: Date;
}

export const PaymentAllocationSchema = SchemaFactory.createForClass(PaymentAllocation);
PaymentAllocationSchema.index({ paymentId: 1 });
PaymentAllocationSchema.index({ chargeId: 1 });
PaymentAllocationSchema.index({ buildingId: 1, residentId: 1, allocatedAt: -1 });
