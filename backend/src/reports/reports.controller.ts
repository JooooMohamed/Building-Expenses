import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  getMonthly(
    @CurrentUser('buildingId') buildingId: string,
    @Query('month') month: string,
  ) {
    return this.reportsService.getMonthlyReport(buildingId, month);
  }

  @Get('collection')
  getCollection(
    @CurrentUser('buildingId') buildingId: string,
    @Query('month') month: string,
  ) {
    return this.reportsService.getCollectionStatus(buildingId, month);
  }
}
