import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model, Types } from "mongoose";
import * as admin from "firebase-admin";
import {
  Notification,
  NotificationDocument,
} from "./schemas/notification.schema";
import { User, UserDocument } from "../users/schemas/user.schema";

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private fcmEnabled = false;

  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const projectId = this.configService.get<string>("FIREBASE_PROJECT_ID");
    const clientEmail = this.configService.get<string>("FIREBASE_CLIENT_EMAIL");
    const privateKey = this.configService.get<string>("FIREBASE_PRIVATE_KEY");

    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        this.fcmEnabled = true;
        this.logger.log(
          "Firebase Admin SDK initialized for push notifications",
        );
      } catch (err) {
        this.logger.warn(`Firebase init failed: ${err.message}`);
      }
    } else {
      this.logger.log(
        "Firebase credentials not configured — push notifications disabled",
      );
    }
  }

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

    // Send push notification via FCM
    await this.sendPush(data.userId, data.title, data.body, data.data);

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
    const result = await this.notifModel.insertMany(docs);

    // Send push notifications in background
    for (const n of notifications) {
      this.sendPush(n.userId, n.title, n.body, n.data).catch(() => {});
    }

    return result;
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    if (!this.fcmEnabled) return;

    try {
      const user = await this.userModel
        .findById(userId)
        .select("fcmTokens")
        .exec();
      if (!user?.fcmTokens?.length) return;

      const message: admin.messaging.MulticastMessage = {
        tokens: user.fcmTokens,
        notification: { title, body },
        data: data
          ? Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (
            !resp.success &&
            resp.error?.code === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(user.fcmTokens[idx]);
          }
        });
        if (invalidTokens.length > 0) {
          await this.userModel.findByIdAndUpdate(userId, {
            $pull: { fcmTokens: { $in: invalidTokens } },
          });
        }
      }
    } catch (err) {
      this.logger.warn(`FCM push failed for user ${userId}: ${err.message}`);
    }
  }

  async getByUser(
    userId: string,
    options: { unreadOnly?: boolean; page?: number; limit?: number } = {},
  ) {
    const { unreadOnly = false, page = 1, limit = 30 } = options;
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };
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

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
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
