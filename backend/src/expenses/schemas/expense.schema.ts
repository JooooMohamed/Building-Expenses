import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema()
export class Recurrence {
  @Prop({ enum: ['monthly', 'quarterly', 'annual'], required: true })
  frequency: string;

  @Prop({ default: 1 })
  dayOfMonth: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;
}

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({
    required: true,
    enum: ['fixed', 'maintenance', 'elevator', 'project', 'emergency'],
  })
  category: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'TRY' })
  currency: string;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop({ type: Recurrence })
  recurrence?: Recurrence;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null, required: false })
  projectId: Types.ObjectId | null;

  @Prop({ enum: ['active', 'cancelled'], default: 'active' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  date: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ buildingId: 1, category: 1 });
ExpenseSchema.index({ buildingId: 1, date: -1 });
