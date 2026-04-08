import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingPeriod, BillingPeriodSchema } from './schemas/billing-period.schema';
import { ResidentCharge, ResidentChargeSchema } from './schemas/resident-charge.schema';
import { PaymentAllocation, PaymentAllocationSchema } from './schemas/payment-allocation.schema';
import { ExpenseShare, ExpenseShareSchema } from '../expenses/schemas/expense-share.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Unit, UnitSchema } from '../units/schemas/unit.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BillingPeriod.name, schema: BillingPeriodSchema },
      { name: ResidentCharge.name, schema: ResidentChargeSchema },
      { name: PaymentAllocation.name, schema: PaymentAllocationSchema },
      { name: ExpenseShare.name, schema: ExpenseShareSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
