import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin/payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  getAll(
    @CurrentUser('buildingId') buildingId: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.getAllPayments(buildingId, status);
  }

  @Post('cash')
  recordCash(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') adminId: string,
    @Body()
    body: {
      residentId: string;
      unitId: string;
      amount: number;
      paymentDate: string;
      expenseShareIds: string[];
      notes?: string;
    },
  ) {
    return this.paymentsService.recordCashPayment(buildingId, adminId, body);
  }
}
