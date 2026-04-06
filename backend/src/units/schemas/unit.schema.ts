import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnitDocument = Unit & Document;

@Schema({ timestamps: true })
export class Unit {
  @Prop({ type: Types.ObjectId, ref: 'Building', required: true, index: true })
  buildingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  unitNumber: string;

  @Prop({ required: true })
  floor: number;

  @Prop({ default: 1.0 })
  shareCoefficient: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  residentId: Types.ObjectId | null;

  @Prop({ enum: ['apartment', 'commercial', 'parking'], default: 'apartment' })
  type: string;

  @Prop()
  area: number;

  @Prop({ default: false })
  isOccupied: boolean;
}

export const UnitSchema = SchemaFactory.createForClass(Unit);
UnitSchema.index({ buildingId: 1, unitNumber: 1 }, { unique: true });
