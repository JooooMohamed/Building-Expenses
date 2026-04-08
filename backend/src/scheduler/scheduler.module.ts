import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Building, BuildingSchema } from '../buildings/schemas/building.schema';
import { ResidentCharge, ResidentChargeSchema } from '../billing/schemas/resident-charge.schema';
import { ExpenseShare, ExpenseShareSchema } from '../expenses/schemas/expense-share.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Building.name, schema: BuildingSchema },
      { name: ResidentCharge.name, schema: ResidentChargeSchema },
      { name: ExpenseShare.name, schema: ExpenseShareSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
