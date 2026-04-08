import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { ExpenseShare, ExpenseShareSchema } from '../expenses/schemas/expense-share.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ResidentPaymentsController } from './resident-payments.controller';
import { NestpayProvider } from './providers/nestpay.provider';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: ExpenseShare.name, schema: ExpenseShareSchema },
    ]),
    BillingModule,
  ],
  controllers: [PaymentsController, ResidentPaymentsController],
  providers: [PaymentsService, NestpayProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
