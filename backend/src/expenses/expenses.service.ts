import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as dayjs from "dayjs";
import { Expense, ExpenseDocument } from "./schemas/expense.schema";
import {
  ExpenseShare,
  ExpenseShareDocument,
} from "./schemas/expense-share.schema";
import {
  ResidentCharge,
  ResidentChargeDocument,
} from "../billing/schemas/resident-charge.schema";
import {
  BillingPeriod,
  BillingPeriodDocument,
} from "../billing/schemas/billing-period.schema";
import { UnitsService } from "../units/units.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(ExpenseShare.name)
    private shareModel: Model<ExpenseShareDocument>,
    @InjectModel(ResidentCharge.name)
    private chargeModel: Model<ResidentChargeDocument>,
    @InjectModel(BillingPeriod.name)
    private billingPeriodModel: Model<BillingPeriodDocument>,
    private unitsService: UnitsService,
  ) {}

  async create(buildingId: string, userId: string, dto: CreateExpenseDto) {
    const expense = await this.expenseModel.create({
      ...dto,
      buildingId: new Types.ObjectId(buildingId),
      createdBy: new Types.ObjectId(userId),
      date: new Date(dto.date),
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
    });

    // Distribute expense to all occupied units
    await this.distributeExpense(buildingId, expense);

    return expense;
  }

  private async distributeExpense(
    buildingId: string,
    expense: ExpenseDocument,
  ) {
    const units = await this.unitsService.findOccupied(buildingId);
    if (units.length === 0) return;

    const bId = new Types.ObjectId(buildingId);
    const totalCoefficient = units.reduce(
      (sum, u) => sum + u.shareCoefficient,
      0,
    );
    const period = dayjs(expense.date).format("YYYY-MM");
    const dueDate = dayjs(expense.date).endOf("month").toDate();

    // Create legacy ExpenseShare records
    const shares = units.map((unit) => ({
      buildingId: bId,
      expenseId: expense._id,
      unitId: unit._id,
      residentId: unit.residentId,
      amount:
        Math.round(
          ((expense.amount * unit.shareCoefficient) / totalCoefficient) * 100,
        ) / 100,
      period,
      dueDate,
      status: "unpaid",
      paidAmount: 0,
    }));

    await this.shareModel.insertMany(shares);

    // Also create ResidentCharge records in the new billing system
    try {
      let billingPeriod = await this.billingPeriodModel.findOne({
        buildingId: bId,
        period,
      });
      if (!billingPeriod) {
        billingPeriod = await this.billingPeriodModel.create({
          buildingId: bId,
          period,
          startDate: dayjs(period, "YYYY-MM").startOf("month").toDate(),
          endDate: dayjs(period, "YYYY-MM").endOf("month").toDate(),
          dueDate,
          totalCharged: 0,
          generatedBy: expense.createdBy,
        });
      }

      const charges = units.map((unit) => ({
        buildingId: bId,
        billingPeriodId: billingPeriod._id,
        unitId: unit._id,
        residentId: unit.residentId,
        period,
        amount:
          Math.round(
            ((expense.amount * unit.shareCoefficient) / totalCoefficient) * 100,
          ) / 100,
        dueDate,
        chargeType: expense.isRecurring ? "recurring" : "one_time",
        description: expense.title,
        relatedExpenseIds: [expense._id],
      }));

      await this.chargeModel.insertMany(charges);

      const totalCharged = charges.reduce((sum, c) => sum + c.amount, 0);
      billingPeriod.totalCharged += totalCharged;
      await billingPeriod.save();
    } catch (err) {
      this.logger.warn(
        `Failed to sync expense ${expense._id} to billing system: ${err.message}`,
      );
    }
  }

  async findByBuilding(buildingId: string, category?: string) {
    const filter: Record<string, unknown> = {
      buildingId: new Types.ObjectId(buildingId),
      status: "active",
    };
    if (category) filter.category = category;
    return this.expenseModel.find(filter).sort({ date: -1 }).exec();
  }

  async getAggregatedExpenses(buildingId: string, period?: string) {
    const match: Record<string, unknown> = {
      buildingId: new Types.ObjectId(buildingId),
      status: "active",
    };
    if (period) {
      const start = dayjs(period, "YYYY-MM").startOf("month").toDate();
      const end = dayjs(period, "YYYY-MM").endOf("month").toDate();
      match.date = { $gte: start, $lte: end };
    }

    return this.expenseModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  async getResidentShares(residentId: string, status?: string) {
    const filter: Record<string, unknown> = {
      residentId: new Types.ObjectId(residentId),
    };
    if (status) filter.status = status;
    return this.shareModel
      .find(filter)
      .populate("expenseId", "title category")
      .sort({ dueDate: -1 })
      .exec();
  }

  async getResidentBalance(residentId: string) {
    const result = await this.shareModel.aggregate([
      { $match: { residentId: new Types.ObjectId(residentId) } },
      {
        $group: {
          _id: null,
          totalDue: { $sum: "$amount" },
          totalPaid: { $sum: "$paidAmount" },
        },
      },
    ]);

    if (result.length === 0)
      return { totalDue: 0, totalPaid: 0, remainingBalance: 0 };

    return {
      totalDue: result[0].totalDue,
      totalPaid: result[0].totalPaid,
      remainingBalance: result[0].totalDue - result[0].totalPaid,
    };
  }

  async cancel(id: string) {
    const expense = await this.expenseModel.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true },
    );
    if (!expense) throw new NotFoundException("Expense not found");

    // Remove unpaid shares for this expense
    await this.shareModel.deleteMany({
      expenseId: expense._id,
      status: "unpaid",
    });

    return expense;
  }
}
