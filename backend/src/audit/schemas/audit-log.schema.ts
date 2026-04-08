import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  action: string; // e.g. 'expense.create', 'payment.cash.record', 'resident.create'

  @Prop({ required: true })
  resource: string; // e.g. 'Expense', 'Payment', 'User'

  @Prop({ type: Types.ObjectId })
  resourceId: Types.ObjectId;

  @Prop({ type: Object })
  details: Record<string, unknown>; // change summary, relevant fields

  @Prop()
  ip: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ buildingId: 1, createdAt: -1 });
AuditLogSchema.index({ buildingId: 1, action: 1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
