import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BuildingDocument = Building & Document;

@Schema()
export class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  district: string;

  @Prop()
  postalCode: string;
}

@Schema()
export class BuildingSettings {
  @Prop({ default: 'nestpay' })
  paymentGateway: string;

  @Prop({ default: 'monthly' })
  defaultPaymentFrequency: string;

  @Prop({ default: 0 })
  lateFeePercentage: number;

  @Prop({ default: 1 })
  fiscalYearStart: number; // month 1-12

  @Prop({ default: 25 })
  dueDayOfMonth: number; // day charges are due
}

@Schema({ timestamps: true })
export class Building {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Address, required: true })
  address: Address;

  @Prop({ required: true })
  totalUnits: number;

  @Prop({ default: 'TRY' })
  currency: string;

  @Prop({ type: BuildingSettings, default: () => ({}) })
  settings: BuildingSettings;

  @Prop({ default: true })
  isActive: boolean;
}

export const BuildingSchema = SchemaFactory.createForClass(Building);
