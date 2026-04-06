import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin/expenses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  create(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(buildingId, userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('buildingId') buildingId: string,
    @Query('category') category?: string,
  ) {
    return this.expensesService.findByBuilding(buildingId, category);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.expensesService.cancel(id);
  }
}
