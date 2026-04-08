import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Building, BuildingDocument } from './schemas/building.schema';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/create-building.dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectModel(Building.name) private buildingModel: Model<BuildingDocument>,
  ) {}

  async create(dto: CreateBuildingDto): Promise<BuildingDocument> {
    return this.buildingModel.create(dto);
  }

  async findById(id: string): Promise<BuildingDocument> {
    const building = await this.buildingModel.findById(id);
    if (!building) throw new NotFoundException('Building not found');
    return building;
  }

  async update(id: string, dto: UpdateBuildingDto): Promise<BuildingDocument> {
    const building = await this.buildingModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!building) throw new NotFoundException('Building not found');
    return building;
  }

  async findAll(): Promise<BuildingDocument[]> {
    return this.buildingModel.find({ isActive: true }).exec();
  }
}
