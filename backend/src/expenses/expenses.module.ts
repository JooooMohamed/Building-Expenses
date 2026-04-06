import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from './schemas/expense.schema';
import { ExpenseShare, ExpenseShareSchema } from './schemas/expense-share.schema';
import { UnitsModule } from '../units/units.module';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ResidentExpensesController } from './resident-expenses.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: ExpenseShare.name, schema: ExpenseShareSchema },
    ]),
    UnitsModule,
  ],
  controllers: [ExpensesController, ResidentExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
