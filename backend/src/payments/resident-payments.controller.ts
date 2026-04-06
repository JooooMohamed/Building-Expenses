import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class ResidentPaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('me/payments')
  getMyPayments(@CurrentUser('userId') userId: string) {
    return this.paymentsService.getResidentPayments(userId);
  }

  @Post('payments/initiate')
  initiatePayment(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body()
    body: {
      unitId: string;
      amount: number;
      expenseShareIds: string[];
    },
  ) {
    return this.paymentsService.initiateOnlinePayment(
      buildingId,
      userId,
      body.unitId,
      body.amount,
      body.expenseShareIds,
    );
  }

  @Post('payments/callback')
  handleCallback(@Body() body: { orderId: string; [key: string]: string }) {
    const { orderId, ...gatewayResponse } = body;
    return this.paymentsService.handlePaymentCallback(orderId, gatewayResponse);
  }
}
