import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class ResidentExpensesController {
  constructor(private expensesService: ExpensesService) {}

  // Resident views their own expense shares
  @Get('me/expense-shares')
  getMyShares(
    @CurrentUser('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.expensesService.getResidentShares(userId, status);
  }

  // Anyone can see aggregated building expenses (no per-resident data)
  @Get('building/expenses')
  getBuildingExpenses(
    @CurrentUser('buildingId') buildingId: string,
    @Query('period') period?: string,
  ) {
    return this.expensesService.getAggregatedExpenses(buildingId, period);
  }

  // Resident dashboard summary
  @Get('me/dashboard')
  async getDashboard(@CurrentUser('userId') userId: string) {
    const balance = await this.expensesService.getResidentBalance(userId);
    const recentShares = await this.expensesService.getResidentShares(userId);

    return {
      summary: {
        ...balance,
        currency: 'TRY',
      },
      recentDues: recentShares.slice(0, 10),
    };
  }
}
