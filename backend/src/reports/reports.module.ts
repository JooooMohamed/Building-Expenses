import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseShare, ExpenseShareSchema } from '../expenses/schemas/expense-share.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseShare.name, schema: ExpenseShareSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
