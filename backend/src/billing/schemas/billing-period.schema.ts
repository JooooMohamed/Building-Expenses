import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BillingPeriodDocument = BillingPeriod & Document;

@Schema({ timestamps: true })
export class BillingPeriod {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ required: true })
  period: string; // YYYY-MM

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ default: 0 })
  totalCharged: number; // sum of all charges generated in minor units

  @Prop({ default: 0 })
  totalCollected: number; // sum of payments applied

  @Prop({ enum: ['open', 'closed', 'finalized'], default: 'open' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  generatedBy: Types.ObjectId;

  @Prop()
  notes: string;
}

export const BillingPeriodSchema = SchemaFactory.createForClass(BillingPeriod);
BillingPeriodSchema.index({ buildingId: 1, period: 1 }, { unique: true });
