import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseShareDocument = ExpenseShare & Document;

@Schema({ timestamps: true })
export class ExpenseShare {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Expense', required: true })
  expenseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Unit', required: true })
  unitId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  residentId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  period: string; // YYYY-MM

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' })
  status: string;

  @Prop({ default: 0 })
  paidAmount: number;
}

export const ExpenseShareSchema = SchemaFactory.createForClass(ExpenseShare);
ExpenseShareSchema.index({ buildingId: 1, residentId: 1, period: 1 });
ExpenseShareSchema.index({ buildingId: 1, unitId: 1, status: 1 });
ExpenseShareSchema.index({ buildingId: 1, dueDate: 1, status: 1 });
