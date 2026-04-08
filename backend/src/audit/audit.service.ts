import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  async log(entry: {
    buildingId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ip?: string;
  }): Promise<void> {
    await this.auditModel.create({
      buildingId: new Types.ObjectId(entry.buildingId),
      userId: new Types.ObjectId(entry.userId),
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ? new Types.ObjectId(entry.resourceId) : undefined,
      details: entry.details,
      ip: entry.ip,
    });
  }

  async findByBuilding(
    buildingId: string,
    options: { page?: number; limit?: number; action?: string } = {},
  ) {
    const { page = 1, limit = 50, action } = options;
    const filter: Record<string, unknown> = {
      buildingId: new Types.ObjectId(buildingId),
    };
    if (action) filter.action = { $regex: action, $options: 'i' };

    const [data, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
