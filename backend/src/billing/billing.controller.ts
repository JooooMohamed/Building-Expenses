import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { GenerateChargesDto, CreateAssessmentDto, WaiveChargeDto } from './dto/billing.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { AuditService } from '../audit/audit.service';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(
    private billingService: BillingService,
    private auditService: AuditService,
  ) {}

  // ── Admin Endpoints ──────────────────────────────

  @Post('admin/billing/generate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async generateCharges(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateChargesDto,
  ) {
    const result = await this.billingService.generateMonthlyCharges(
      buildingId,
      userId,
      dto.period,
      dto.notes,
    );

    await this.auditService.log({
      buildingId,
      userId,
      action: 'billing.generate',
      resource: 'BillingPeriod',
      resourceId: result.billingPeriod._id.toString(),
      details: { period: dto.period, chargesGenerated: result.chargesGenerated },
    });

    return result;
  }

  @Post('admin/billing/assessment')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createAssessment(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateAssessmentDto,
  ) {
    const result = await this.billingService.createAssessment(buildingId, userId, dto);

    await this.auditService.log({
      buildingId,
      userId,
      action: 'billing.assessment',
      resource: 'ResidentCharge',
      details: { title: dto.title, amount: dto.amount, period: dto.period },
    });

    return result;
  }

  @Get('admin/billing/periods')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getBillingPeriods(@CurrentUser('buildingId') buildingId: string) {
    return this.billingService.getBillingPeriods(buildingId);
  }

  @Get('admin/billing/charges')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getPeriodCharges(
    @CurrentUser('buildingId') buildingId: string,
    @Query('period') period: string,
  ) {
    return this.billingService.getPeriodCharges(buildingId, period);
  }

  @Get('admin/billing/overdue')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getOverdueCharges(@CurrentUser('buildingId') buildingId: string) {
    return this.billingService.getOverdueCharges(buildingId);
  }

  @Get('admin/billing/resident-unpaid/:residentId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getResidentUnpaid(
    @CurrentUser('buildingId') buildingId: string,
    @Param('residentId', ParseObjectIdPipe) residentId: string,
  ) {
    return this.billingService.getResidentUnpaidCharges(buildingId, residentId);
  }

  @Patch('admin/billing/charges/:id/waive')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async waiveCharge(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: WaiveChargeDto,
  ) {
    const result = await this.billingService.waiveCharge(id, dto.reason);

    await this.auditService.log({
      buildingId,
      userId,
      action: 'billing.waive',
      resource: 'ResidentCharge',
      resourceId: id,
      details: { reason: dto.reason },
    });

    return result;
  }

  // ── Resident Endpoints ───────────────────────────

  @Get('me/charges')
  getMyCharges(
    @CurrentUser('userId') userId: string,
    @Query('status') status?: string,
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.getResidentCharges(userId, {
      status,
      period,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('me/balance')
  async getMyBalance(@CurrentUser('userId') userId: string) {
    const balance = await this.billingService.getResidentBalance(userId);
    const nextDue = await this.billingService.getNextDueDate(userId);
    return { ...balance, nextDueDate: nextDue, currency: 'TRY' };
  }
}
