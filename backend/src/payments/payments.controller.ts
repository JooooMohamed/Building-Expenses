import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { RecordCashPaymentDto } from './dto/create-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@Controller('admin/payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private auditService: AuditService,
  ) {}

  @Get()
  getAll(
    @CurrentUser('buildingId') buildingId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getAllPayments(buildingId, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('cash')
  async recordCash(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') adminId: string,
    @Body() dto: RecordCashPaymentDto,
  ) {
    const result = await this.paymentsService.recordCashPayment(buildingId, adminId, dto);

    await this.auditService.log({
      buildingId,
      userId: adminId,
      action: 'payment.cash.record',
      resource: 'Payment',
      resourceId: result.paymentId.toString(),
      details: {
        residentId: dto.residentId,
        amount: dto.amount,
        receiptNumber: result.receiptNumber,
      },
    });

    return result;
  }
}
