import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name) private model: Model<AnnouncementDocument>,
  ) {}

  async create(buildingId: string, userId: string, data: { title: string; body: string; priority?: string }) {
    return this.model.create({
      ...data,
      buildingId: new Types.ObjectId(buildingId),
      createdBy: new Types.ObjectId(userId),
    });
  }

  async findByBuilding(buildingId: string) {
    return this.model
      .find({ buildingId: new Types.ObjectId(buildingId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }
}
