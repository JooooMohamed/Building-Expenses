import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(buildingId: string, dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.userModel.create({
      ...dto,
      buildingId: new Types.ObjectId(buildingId),
      passwordHash,
      unitIds: dto.unitIds?.map((id) => new Types.ObjectId(id)) || [],
    });
  }

  async findById(id: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findById(id);
    if (includePassword) query.select('+passwordHash');
    return query.exec();
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+passwordHash');
    return query.exec();
  }

  async findByBuilding(buildingId: string, role?: string): Promise<UserDocument[]> {
    const filter: Record<string, unknown> = { buildingId: new Types.ObjectId(buildingId), isActive: true };
    if (role) filter.role = role;
    return this.userModel.find(filter).select('-passwordHash -refreshToken').exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .select('-passwordHash -refreshToken')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deactivate(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { isActive: false });
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshToken: token });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  async updatePassword(id: string, hash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { passwordHash: hash, refreshToken: null });
  }

  async updateFcmToken(id: string, token: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $addToSet: { fcmTokens: token } });
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const result = await this.userModel.findOneAndUpdate(
      { email: email.toLowerCase(), isActive: true },
      { passwordResetToken: token, passwordResetExpiry: expiry },
    );
    return !!result;
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
      isActive: true,
    });
  }

  async resetPassword(userId: string, hash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      passwordHash: hash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshToken: null,
    });
  }

  async updateProfile(id: string, data: { phone?: string; firstName?: string; lastName?: string }): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .select('-passwordHash -refreshToken -passwordResetToken')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
