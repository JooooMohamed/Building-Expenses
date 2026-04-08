import { Controller, Get, Post, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class ResidentPaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('me/payments')
  @UseGuards(AuthGuard('jwt'))
  getMyPayments(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getResidentPayments(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('payments/initiate')
  @UseGuards(AuthGuard('jwt'))
  initiatePayment(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiateOnlinePayment(buildingId, userId, dto);
  }

  /**
   * Payment gateway server-to-server callback.
   * NOT authenticated via JWT — uses gateway signature verification instead.
   * Idempotent: safe to call multiple times for the same payment.
   */
  @Post('payments/callback')
  @HttpCode(200)
  handleCallback(@Body() body: Record<string, string>) {
    const orderId = body.oid || body.orderId || '';
    return this.paymentsService.handlePaymentCallback(orderId, body);
  }
}
