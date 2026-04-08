import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as dayjs from 'dayjs';
import { Building, BuildingDocument } from '../buildings/schemas/building.schema';
import { ResidentCharge, ResidentChargeDocument } from '../billing/schemas/resident-charge.schema';
import { ExpenseShare, ExpenseShareDocument } from '../expenses/schemas/expense-share.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel(Building.name) private buildingModel: Model<BuildingDocument>,
    @InjectModel(ResidentCharge.name) private chargeModel: Model<ResidentChargeDocument>,
    @InjectModel(ExpenseShare.name) private shareModel: Model<ExpenseShareDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Send payment reminders 3 days before due date.
   * Runs daily at 9:00 AM.
   */
  @Cron('0 9 * * *')
  async sendPaymentReminders() {
    this.logger.log('Running payment reminder job');

    const threeDaysFromNow = dayjs().add(3, 'day').startOf('day').toDate();
    const threeDaysEnd = dayjs().add(3, 'day').endOf('day').toDate();

    // Find charges due in 3 days that are still unpaid/partial
    const charges = await this.chargeModel
      .find({
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $gte: threeDaysFromNow, $lte: threeDaysEnd },
      })
      .populate('residentId', 'firstName')
      .exec();

    for (const charge of charges) {
      const remaining = charge.amount - charge.paidAmount;
      await this.notificationsService.create({
        buildingId: charge.buildingId.toString(),
        userId: charge.residentId.toString(),
        type: 'payment_reminder',
        title: 'Payment Due Soon',
        body: `Your payment of ${remaining.toLocaleString()} TRY for ${charge.period} is due in 3 days.`,
        data: { chargeId: charge._id.toString(), amount: remaining },
      });
    }

    // Also check legacy expense shares
    const shares = await this.shareModel
      .find({
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $gte: threeDaysFromNow, $lte: threeDaysEnd },
      })
      .exec();

    const notifiedResidents = new Set(charges.map((c) => c.residentId.toString()));
    for (const share of shares) {
      if (notifiedResidents.has(share.residentId.toString())) continue;
      const remaining = share.amount - share.paidAmount;
      await this.notificationsService.create({
        buildingId: share.buildingId.toString(),
        userId: share.residentId.toString(),
        type: 'payment_reminder',
        title: 'Payment Due Soon',
        body: `Your payment of ${remaining.toLocaleString()} TRY for ${share.period} is due in 3 days.`,
        data: { shareId: share._id.toString(), amount: remaining },
      });
    }

    this.logger.log(`Sent ${charges.length + shares.length} payment reminders`);
  }

  /**
   * Send overdue notices 1 day after due date.
   * Runs daily at 10:00 AM.
   */
  @Cron('0 10 * * *')
  async sendOverdueNotices() {
    this.logger.log('Running overdue notice job');

    const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
    const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day').toDate();

    const overdueCharges = await this.chargeModel
      .find({
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $gte: yesterday, $lte: yesterdayEnd },
      })
      .exec();

    for (const charge of overdueCharges) {
      const remaining = charge.amount - charge.paidAmount;
      await this.notificationsService.create({
        buildingId: charge.buildingId.toString(),
        userId: charge.residentId.toString(),
        type: 'overdue',
        title: 'Payment Overdue',
        body: `Your payment of ${remaining.toLocaleString()} TRY for ${charge.period} is now overdue. Please pay as soon as possible.`,
        data: { chargeId: charge._id.toString(), amount: remaining },
      });
    }

    this.logger.log(`Sent ${overdueCharges.length} overdue notices`);
  }

  /**
   * Clean up stale pending online payments (older than 1 hour).
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStalePendingPayments() {
    const oneHourAgo = dayjs().subtract(1, 'hour').toDate();

    const { modifiedCount } = await this.chargeModel.updateMany(
      { status: 'pending', createdAt: { $lt: oneHourAgo } },
      { $set: { status: 'unpaid' } },
    );

    if (modifiedCount > 0) {
      this.logger.log(`Reset ${modifiedCount} stale pending charges`);
    }
  }
}
