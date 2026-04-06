import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Unit, UnitDocument } from './schemas/unit.schema';

@Injectable()
export class UnitsService {
  constructor(@InjectModel(Unit.name) private unitModel: Model<UnitDocument>) {}

  async create(buildingId: string, data: Partial<Unit>): Promise<UnitDocument> {
    return this.unitModel.create({
      ...data,
      buildingId: new Types.ObjectId(buildingId),
    });
  }

  async findByBuilding(buildingId: string): Promise<UnitDocument[]> {
    return this.unitModel
      .find({ buildingId: new Types.ObjectId(buildingId) })
      .populate('residentId', 'firstName lastName email')
      .sort({ floor: 1, unitNumber: 1 })
      .exec();
  }

  async findOccupied(buildingId: string): Promise<UnitDocument[]> {
    return this.unitModel
      .find({
        buildingId: new Types.ObjectId(buildingId),
        isOccupied: true,
        residentId: { $ne: null },
      })
      .exec();
  }

  async update(id: string, data: Partial<Unit>): Promise<UnitDocument> {
    const unit = await this.unitModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async assignResident(unitId: string, residentId: string): Promise<UnitDocument> {
    return this.update(unitId, {
      residentId: new Types.ObjectId(residentId),
      isOccupied: true,
    } as Partial<Unit>);
  }
}
