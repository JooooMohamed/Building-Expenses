import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, enum: ['admin', 'resident'], default: 'resident' })
  role: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Unit' }], default: [] })
  unitIds: Types.ObjectId[];

  @Prop({ enum: ['monthly', 'bimonthly', 'quarterly', 'biannual', 'annual'], default: 'monthly' })
  paymentFrequency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  fcmTokens: string[];

  @Prop()
  refreshToken?: string;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ buildingId: 1, role: 1 });
UserSchema.index({ buildingId: 1, isActive: 1 });
