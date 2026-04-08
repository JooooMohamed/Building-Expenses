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

    // TODO: Send push notification via FCM when implemented
    // For now, notifications are in-app only

    return notification;
  }

  async createBatch(
    notifications: Array<{
      buildingId: string;
      userId: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }>,
  ) {
    const docs = notifications.map((n) => ({
      ...n,
      buildingId: new Types.ObjectId(n.buildingId),
      userId: new Types.ObjectId(n.userId),
    }));
    return this.notifModel.insertMany(docs);
  }

  async getByUser(
    userId: string,
    options: { unreadOnly?: boolean; page?: number; limit?: number } = {},
  ) {
    const { unreadOnly = false, page = 1, limit = 30 } = options;
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) filter.isRead = false;

    const [data, total] = await Promise.all([
      this.notifModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.notifModel.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async markRead(id: string, userId: string) {
    return this.notifModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true },
      { new: true },
    );
  }

  async markAllRead(userId: string) {
    const result = await this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
    return { marked: result.modifiedCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }
}
