import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as dayjs from 'dayjs';
import { Expense, ExpenseDocument } from '../expenses/schemas/expense.schema';
import { ExpenseShare, ExpenseShareDocument } from '../expenses/schemas/expense-share.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(ExpenseShare.name) private shareModel: Model<ExpenseShareDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async getMonthlyReport(buildingId: string, month: string) {
    const bId = new Types.ObjectId(buildingId);
    const start = dayjs(month, 'YYYY-MM').startOf('month').toDate();
    const end = dayjs(month, 'YYYY-MM').endOf('month').toDate();

    // Expense breakdown by category
    const expenses = await this.expenseModel.aggregate([
      { $match: { buildingId: bId, date: { $gte: start, $lte: end }, status: 'active' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const expenseMap: Record<string, number> = {};
    let expenseTotal = 0;
    for (const e of expenses) {
      expenseMap[e._id] = e.total;
      expenseTotal += e.total;
    }

    // Collections for this period
    const collections = await this.paymentModel.aggregate([
      {
        $match: {
          buildingId: bId,
          paymentDate: { $gte: start, $lte: end },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const collectionByMethod: Record<string, number> = {};
    let collectionTotal = 0;
    for (const c of collections) {
      collectionByMethod[c._id] = c.total;
      collectionTotal += c.total;
    }

    // Outstanding for this period
    const outstanding = await this.shareModel.aggregate([
      { $match: { buildingId: bId, period: month, status: { $ne: 'paid' } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ['$amount', '$paidAmount'] } },
          residentCount: { $addToSet: '$residentId' },
        },
      },
    ]);

    return {
      period: month,
      expenses: { ...expenseMap, total: expenseTotal },
      collections: {
        expected: expenseTotal,
        collected: collectionTotal,
        collectionRate: expenseTotal > 0 ? Math.round((collectionTotal / expenseTotal) * 100 * 10) / 10 : 0,
        byMethod: collectionByMethod,
      },
      outstanding: {
        total: outstanding[0]?.total || 0,
        residentCount: outstanding[0]?.residentCount?.length || 0,
      },
    };
  }

  async getCollectionStatus(buildingId: string, month: string) {
    const bId = new Types.ObjectId(buildingId);

    const residents = await this.shareModel.aggregate([
      { $match: { buildingId: bId, period: month } },
      {
        $group: {
          _id: '$residentId',
          totalDue: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'units',
          localField: '_id',
          foreignField: 'residentId',
          as: 'units',
        },
      },
      {
        $project: {
          residentId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          unit: { $arrayElemAt: ['$units.unitNumber', 0] },
          totalDue: 1,
          totalPaid: 1,
          status: {
            $cond: [
              { $gte: ['$totalPaid', '$totalDue'] },
              'paid',
              { $cond: [{ $gt: ['$totalPaid', 0] }, 'partial', 'unpaid'] },
            ],
          },
        },
      },
      { $sort: { status: 1, name: 1 } },
    ]);

    const summary = { paid: 0, partial: 0, unpaid: 0, total: residents.length };
    for (const r of residents) {
      summary[r.status as keyof typeof summary]++;
    }

    return { residents, summary };
  }
}
