import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { ExpenseShare, ExpenseShareSchema } from '../expenses/schemas/expense-share.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ResidentPaymentsController } from './resident-payments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: ExpenseShare.name, schema: ExpenseShareSchema },
    ]),
  ],
  controllers: [PaymentsController, ResidentPaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
