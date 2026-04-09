import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Expense, ExpenseSchema } from "./schemas/expense.schema";
import {
  ExpenseShare,
  ExpenseShareSchema,
} from "./schemas/expense-share.schema";
import {
  ResidentCharge,
  ResidentChargeSchema,
} from "../billing/schemas/resident-charge.schema";
import {
  BillingPeriod,
  BillingPeriodSchema,
} from "../billing/schemas/billing-period.schema";
import { UnitsModule } from "../units/units.module";
import { ExpensesService } from "./expenses.service";
import { ExpensesController } from "./expenses.controller";
import { ResidentExpensesController } from "./resident-expenses.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: ExpenseShare.name, schema: ExpenseShareSchema },
      { name: ResidentCharge.name, schema: ResidentChargeSchema },
      { name: BillingPeriod.name, schema: BillingPeriodSchema },
    ]),
    UnitsModule,
  ],
  controllers: [ExpensesController, ResidentExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
