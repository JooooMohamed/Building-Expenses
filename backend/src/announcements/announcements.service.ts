import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name) private model: Model<AnnouncementDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    buildingId: string,
    userId: string,
    data: { title: string; body: string; priority?: string },
  ) {
    const announcement = await this.model.create({
      ...data,
      buildingId: new Types.ObjectId(buildingId),
      createdBy: new Types.ObjectId(userId),
    });

    // Notify all active residents in the building
    const residents = await this.userModel.find({
      buildingId: new Types.ObjectId(buildingId),
      role: 'resident',
      isActive: true,
    });

    for (const resident of residents) {
      await this.notificationsService.create({
        buildingId,
        userId: resident._id.toString(),
        type: 'announcement',
        title: `New Announcement: ${data.title}`,
        body: data.body.substring(0, 200),
        data: { announcementId: announcement._id.toString() },
      });
    }

    return announcement;
  }

  async findByBuilding(
    buildingId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const filter = { buildingId: new Types.ObjectId(buildingId) };

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, data: { title?: string; body?: string; priority?: string }) {
    const announcement = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async remove(id: string) {
    const announcement = await this.model.findByIdAndDelete(id);
    if (!announcement) throw new NotFoundException('Announcement not found');
    return { deleted: true };
  }
}
