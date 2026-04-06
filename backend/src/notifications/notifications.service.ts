import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
  ) {}

  async create(data: {
    buildingId: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await this.notifModel.create({
      ...data,
      buildingId: new Types.ObjectId(data.buildingId),
      userId: new Types.ObjectId(data.userId),
    });

    // TODO: Send push notification via FCM
    // await this.sendPush(data.userId, data.title, data.body, data.data);

    return notification;
  }

  async getByUser(userId: string, unreadOnly = false) {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) filter.isRead = false;
    return this.notifModel.find(filter).sort({ createdAt: -1 }).limit(50).exec();
  }

  async markRead(id: string, userId: string) {
    return this.notifModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }
}
