import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResidentChargeDocument = ResidentCharge & Document;

@Schema({ timestamps: true })
export class ResidentCharge {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BillingPeriod', required: true })
  billingPeriodId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Unit', required: true })
  unitId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  residentId: Types.ObjectId;

  @Prop({ required: true })
  period: string; // YYYY-MM

  @Prop({ required: true })
  amount: number; // total charge amount for this unit/period

  @Prop({ default: 0 })
  paidAmount: number; // derived from payment allocations

  @Prop({
    required: true,
    enum: ['unpaid', 'partial', 'paid', 'overpaid', 'cancelled', 'waived'],
    default: 'unpaid',
  })
  status: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: String, enum: ['recurring', 'one_time', 'assessment'], default: 'recurring' })
  chargeType: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Expense' }], default: [] })
  relatedExpenseIds: Types.ObjectId[];

  @Prop()
  notes: string;
}

export const ResidentChargeSchema = SchemaFactory.createForClass(ResidentCharge);
ResidentChargeSchema.index({ buildingId: 1, residentId: 1, period: 1 });
ResidentChargeSchema.index({ buildingId: 1, unitId: 1, status: 1 });
ResidentChargeSchema.index({ buildingId: 1, dueDate: 1, status: 1 });
ResidentChargeSchema.index({ billingPeriodId: 1 });
