import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import * as dayjs from 'dayjs';
import { BillingPeriod, BillingPeriodDocument } from './schemas/billing-period.schema';
import { ResidentCharge, ResidentChargeDocument } from './schemas/resident-charge.schema';
import { PaymentAllocation, PaymentAllocationDocument } from './schemas/payment-allocation.schema';
import { ExpenseShare, ExpenseShareDocument } from '../expenses/schemas/expense-share.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { Unit, UnitDocument } from '../units/schemas/unit.schema';
import { Expense, ExpenseDocument } from '../expenses/schemas/expense.schema';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(BillingPeriod.name) private billingPeriodModel: Model<BillingPeriodDocument>,
    @InjectModel(ResidentCharge.name) private chargeModel: Model<ResidentChargeDocument>,
    @InjectModel(PaymentAllocation.name) private allocationModel: Model<PaymentAllocationDocument>,
    @InjectModel(ExpenseShare.name) private shareModel: Model<ExpenseShareDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Unit.name) private unitModel: Model<UnitDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Generate monthly charges for all occupied units in a building.
   * This creates a BillingPeriod and ResidentCharges based on active expenses.
   */
  async generateMonthlyCharges(
    buildingId: string,
    userId: string,
    period: string,
    notes?: string,
  ) {
    const bId = new Types.ObjectId(buildingId);

    // Check if billing period already exists
    const existing = await this.billingPeriodModel.findOne({ buildingId: bId, period });
    if (existing) {
      throw new BadRequestException(`Billing period ${period} already exists`);
    }

    const startDate = dayjs(period, 'YYYY-MM').startOf('month').toDate();
    const endDate = dayjs(period, 'YYYY-MM').endOf('month').toDate();
    const dueDate = dayjs(period, 'YYYY-MM').date(25).toDate(); // due on 25th

    // Get all active expenses for this period
    const expenses = await this.expenseModel.find({
      buildingId: bId,
      status: 'active',
      $or: [
        { isRecurring: true },
        { date: { $gte: startDate, $lte: endDate } },
      ],
    });

    // Get occupied units
    const units = await this.unitModel.find({
      buildingId: bId,
      isOccupied: true,
      residentId: { $ne: null },
    });

    if (units.length === 0) {
      throw new BadRequestException('No occupied units found');
    }

    const totalCoefficient = units.reduce((sum, u) => sum + u.shareCoefficient, 0);
    const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Create billing period
    const billingPeriod = await this.billingPeriodModel.create({
      buildingId: bId,
      period,
      startDate,
      endDate,
      dueDate,
      totalCharged: 0,
      generatedBy: new Types.ObjectId(userId),
      notes,
    });

    // Create charges per unit and matching expense shares
    const charges: ResidentChargeDocument[] = [];
    const expenseShares: Array<Record<string, unknown>> = [];

    for (const unit of units) {
      const unitShare = unit.shareCoefficient / totalCoefficient;
      const chargeAmount = Math.round(totalExpenseAmount * unitShare * 100) / 100;

      const charge = await this.chargeModel.create({
        buildingId: bId,
        billingPeriodId: billingPeriod._id,
        unitId: unit._id,
        residentId: unit.residentId,
        period,
        amount: chargeAmount,
        dueDate,
        chargeType: 'recurring',
        description: `Monthly charges for ${period}`,
        relatedExpenseIds: expenses.map((e) => e._id),
      });
      charges.push(charge);

      // Also create expense shares for backward compatibility
      for (const expense of expenses) {
        const shareAmount = Math.round((expense.amount * unitShare) * 100) / 100;
        expenseShares.push({
          buildingId: bId,
          expenseId: expense._id,
          unitId: unit._id,
          residentId: unit.residentId,
          amount: shareAmount,
          period,
          dueDate,
          status: 'unpaid',
          paidAmount: 0,
        });
      }
    }

    // Bulk insert expense shares
    if (expenseShares.length > 0) {
      await this.shareModel.insertMany(expenseShares);
    }

    // Update billing period totals
    const totalCharged = charges.reduce((sum, c) => sum + c.amount, 0);
    billingPeriod.totalCharged = totalCharged;
    await billingPeriod.save();

    return {
      billingPeriod,
      chargesGenerated: charges.length,
      totalCharged,
      expenseSharesGenerated: expenseShares.length,
    };
  }

  /**
   * Create a one-time assessment (extraordinary charge) distributed across units.
   */
  async createAssessment(
    buildingId: string,
    userId: string,
    dto: {
      title: string;
      amount: number;
      period: string;
      distributionMethod?: string;
      targetUnitIds?: string[];
      description?: string;
      dueDate?: string;
    },
  ) {
    const bId = new Types.ObjectId(buildingId);
    const method = dto.distributionMethod || 'equal';

    // Get or create billing period
    let billingPeriod = await this.billingPeriodModel.findOne({ buildingId: bId, period: dto.period });
    if (!billingPeriod) {
      const startDate = dayjs(dto.period, 'YYYY-MM').startOf('month').toDate();
      const endDate = dayjs(dto.period, 'YYYY-MM').endOf('month').toDate();
      billingPeriod = await this.billingPeriodModel.create({
        buildingId: bId,
        period: dto.period,
        startDate,
        endDate,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : dayjs(dto.period, 'YYYY-MM').date(25).toDate(),
        totalCharged: 0,
        generatedBy: new Types.ObjectId(userId),
      });
    }

    // Determine target units
    let units: UnitDocument[];
    if (dto.targetUnitIds && dto.targetUnitIds.length > 0) {
      units = await this.unitModel.find({
        _id: { $in: dto.targetUnitIds.map((id) => new Types.ObjectId(id)) },
        buildingId: bId,
      });
    } else {
      units = await this.unitModel.find({
        buildingId: bId,
        isOccupied: true,
        residentId: { $ne: null },
      });
    }

    if (units.length === 0) {
      throw new BadRequestException('No target units found');
    }

    // Calculate per-unit amounts
    const charges: ResidentChargeDocument[] = [];
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : dayjs(dto.period, 'YYYY-MM').date(25).toDate();

    if (method === 'equal') {
      const perUnit = Math.round((dto.amount / units.length) * 100) / 100;
      for (const unit of units) {
        const charge = await this.chargeModel.create({
          buildingId: bId,
          billingPeriodId: billingPeriod._id,
          unitId: unit._id,
          residentId: unit.residentId,
          period: dto.period,
          amount: perUnit,
          dueDate,
          chargeType: 'assessment',
          description: dto.title,
          notes: dto.description,
        });
        charges.push(charge);
      }
    } else if (method === 'by_coefficient') {
      const totalCoeff = units.reduce((sum, u) => sum + u.shareCoefficient, 0);
      for (const unit of units) {
        const amount = Math.round((dto.amount * (unit.shareCoefficient / totalCoeff)) * 100) / 100;
        const charge = await this.chargeModel.create({
          buildingId: bId,
          billingPeriodId: billingPeriod._id,
          unitId: unit._id,
          residentId: unit.residentId,
          period: dto.period,
          amount,
          dueDate,
          chargeType: 'assessment',
          description: dto.title,
          notes: dto.description,
        });
        charges.push(charge);
      }
    }

    // Update billing period total
    const addedTotal = charges.reduce((sum, c) => sum + c.amount, 0);
    billingPeriod.totalCharged += addedTotal;
    await billingPeriod.save();

    return {
      billingPeriod,
      chargesGenerated: charges.length,
      totalCharged: addedTotal,
    };
  }

  /**
   * Allocate a payment to the oldest unpaid charges (FIFO).
   * Returns the allocations and any remaining credit.
   */
  async allocatePayment(
    buildingId: string,
    paymentId: string,
    residentId: string,
    amount: number,
    specificChargeIds?: string[],
  ): Promise<{ allocations: PaymentAllocationDocument[]; remainingCredit: number }> {
    const bId = new Types.ObjectId(buildingId);
    const rId = new Types.ObjectId(residentId);
    const pId = new Types.ObjectId(paymentId);

    // Get unpaid/partial charges, oldest first
    let charges: ResidentChargeDocument[];
    if (specificChargeIds && specificChargeIds.length > 0) {
      charges = await this.chargeModel
        .find({
          _id: { $in: specificChargeIds.map((id) => new Types.ObjectId(id)) },
          residentId: rId,
          status: { $in: ['unpaid', 'partial'] },
        })
        .sort({ dueDate: 1 })
        .exec();
    } else {
      charges = await this.chargeModel
        .find({
          buildingId: bId,
          residentId: rId,
          status: { $in: ['unpaid', 'partial'] },
        })
        .sort({ dueDate: 1 })
        .exec();
    }

    let remaining = amount;
    const allocations: PaymentAllocationDocument[] = [];

    for (const charge of charges) {
      if (remaining <= 0) break;

      const owed = charge.amount - charge.paidAmount;
      if (owed <= 0) continue;

      const applied = Math.min(remaining, owed);

      const allocation = await this.allocationModel.create({
        buildingId: bId,
        paymentId: pId,
        chargeId: charge._id,
        residentId: rId,
        amount: applied,
        allocatedAt: new Date(),
      });
      allocations.push(allocation);

      charge.paidAmount += applied;
      charge.status = charge.paidAmount >= charge.amount ? 'paid' : 'partial';
      await charge.save();

      remaining -= applied;
    }

    // Also apply to legacy expense shares (FIFO)
    const expenseShares = await this.shareModel
      .find({
        buildingId: bId,
        residentId: rId,
        status: { $in: ['unpaid', 'partial'] },
      })
      .sort({ dueDate: 1 })
      .exec();

    let shareRemaining = amount;
    const appliedTo: Array<{ expenseShareId: Types.ObjectId; amount: number }> = [];

    for (const share of expenseShares) {
      if (shareRemaining <= 0) break;
      const owed = share.amount - share.paidAmount;
      if (owed <= 0) continue;
      const applied = Math.min(shareRemaining, owed);
      share.paidAmount += applied;
      share.status = share.paidAmount >= share.amount ? 'paid' : 'partial';
      await share.save();
      appliedTo.push({ expenseShareId: share._id as Types.ObjectId, amount: applied });
      shareRemaining -= applied;
    }

    // Update payment with appliedTo
    await this.paymentModel.findByIdAndUpdate(pId, { $set: { appliedTo } });

    return { allocations, remainingCredit: remaining };
  }

  /**
   * Get resident's balance summary derived from charges and allocations.
   */
  async getResidentBalance(residentId: string) {
    const rId = new Types.ObjectId(residentId);

    const result = await this.chargeModel.aggregate([
      { $match: { residentId: rId, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalCharged: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
          unpaidCount: {
            $sum: { $cond: [{ $in: ['$status', ['unpaid', 'partial']] }, 1, 0] },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return { totalCharged: 0, totalPaid: 0, remainingBalance: 0, unpaidCount: 0 };
    }

    const { totalCharged, totalPaid, unpaidCount } = result[0];
    return {
      totalCharged,
      totalPaid,
      remainingBalance: totalCharged - totalPaid,
      unpaidCount,
    };
  }

  /**
   * Get charges for a specific resident with pagination.
   */
  async getResidentCharges(
    residentId: string,
    options: { status?: string; period?: string; page?: number; limit?: number } = {},
  ) {
    const { status, period, page = 1, limit = 20 } = options;
    const filter: Record<string, unknown> = {
      residentId: new Types.ObjectId(residentId),
    };
    if (status) filter.status = status;
    if (period) filter.period = period;

    const [data, total] = await Promise.all([
      this.chargeModel
        .find(filter)
        .populate('unitId', 'unitNumber floor')
        .sort({ dueDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.chargeModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get all charges for a billing period (admin).
   */
  async getPeriodCharges(buildingId: string, period: string) {
    const bId = new Types.ObjectId(buildingId);

    const charges = await this.chargeModel
      .find({ buildingId: bId, period })
      .populate('residentId', 'firstName lastName email')
      .populate('unitId', 'unitNumber floor')
      .sort({ 'unitId.unitNumber': 1 })
      .exec();

    const summary = {
      total: charges.length,
      totalAmount: charges.reduce((sum, c) => sum + c.amount, 0),
      totalPaid: charges.reduce((sum, c) => sum + c.paidAmount, 0),
      paid: charges.filter((c) => c.status === 'paid').length,
      partial: charges.filter((c) => c.status === 'partial').length,
      unpaid: charges.filter((c) => c.status === 'unpaid').length,
    };

    return { charges, summary };
  }

  /**
   * Get billing periods for a building.
   */
  async getBillingPeriods(buildingId: string) {
    return this.billingPeriodModel
      .find({ buildingId: new Types.ObjectId(buildingId) })
      .sort({ period: -1 })
      .exec();
  }

  /**
   * Waive a specific charge (admin).
   */
  async waiveCharge(chargeId: string, reason?: string) {
    const charge = await this.chargeModel.findById(chargeId);
    if (!charge) throw new NotFoundException('Charge not found');
    if (charge.status === 'paid') {
      throw new BadRequestException('Cannot waive an already paid charge');
    }

    charge.status = 'waived';
    charge.notes = reason || 'Waived by admin';
    await charge.save();
    return charge;
  }

  /**
   * Get next due date for a resident.
   */
  async getNextDueDate(residentId: string): Promise<Date | null> {
    const charge = await this.chargeModel
      .findOne({
        residentId: new Types.ObjectId(residentId),
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $gte: new Date() },
      })
      .sort({ dueDate: 1 })
      .exec();

    return charge?.dueDate || null;
  }

  /**
   * Get overdue charges for a building (admin report).
   */
  async getOverdueCharges(buildingId: string) {
    return this.chargeModel
      .find({
        buildingId: new Types.ObjectId(buildingId),
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $lt: new Date() },
      })
      .populate('residentId', 'firstName lastName email')
      .populate('unitId', 'unitNumber floor')
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Get ALL unpaid/partial charges for a specific resident (for cash payment recording).
   * Checks ResidentCharge first, falls back to ExpenseShare for backward compatibility.
   */
  async getResidentUnpaidCharges(buildingId: string, residentId: string) {
    const bId = new Types.ObjectId(buildingId);
    const rId = new Types.ObjectId(residentId);

    // Try new billing model first
    const charges = await this.chargeModel
      .find({
        buildingId: bId,
        residentId: rId,
        status: { $in: ['unpaid', 'partial'] },
      })
      .populate('unitId', 'unitNumber floor')
      .sort({ dueDate: 1 })
      .exec();

    if (charges.length > 0) return charges;

    // Fallback to legacy ExpenseShare model
    const shares = await this.shareModel
      .find({
        buildingId: bId,
        residentId: rId,
        status: { $in: ['unpaid', 'partial'] },
      })
      .populate('expenseId', 'title category')
      .populate('unitId', 'unitNumber floor')
      .sort({ dueDate: 1 })
      .exec();

    // Map ExpenseShare to a shape compatible with what the UI expects
    return shares.map((s) => ({
      _id: s._id,
      buildingId: s.buildingId,
      unitId: s.unitId,
      residentId: s.residentId,
      period: s.period,
      amount: s.amount,
      paidAmount: s.paidAmount,
      status: s.status,
      dueDate: s.dueDate,
      chargeType: 'recurring',
      description: (s.expenseId as any)?.title || `Charge for ${s.period}`,
    }));
  }
}
