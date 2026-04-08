import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { LoginDto, ChangePasswordDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email, true);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role as 'admin' | 'resident',
      buildingId: user.buildingId.toString(),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.usersService.updateRefreshToken(user._id.toString(), refreshToken);
    await this.usersService.updateLastLogin(user._id.toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        buildingId: user.buildingId,
        unitIds: user.unitIds,
        paymentFrequency: user.paymentFrequency,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role as 'admin' | 'resident',
        buildingId: user.buildingId.toString(),
      };

      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '30d' });

      await this.usersService.updateRefreshToken(user._id.toString(), newRefreshToken);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.usersService.findById(userId, true);
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(userId, hash);
    return { success: true };
  }

  async forgotPassword(email: string) {
    // Generate a secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    const found = await this.usersService.setPasswordResetToken(email, token, expiry);

    // Always return success to prevent email enumeration
    if (!found) {
      this.logger.warn(`Password reset requested for unknown email: ${email}`);
    }

    // In production, send email with reset link containing the token
    // For MVP, log the token (in dev) so it can be used manually
    if (found && process.env.NODE_ENV !== 'production') {
      this.logger.log(`Password reset token for ${email}: ${token}`);
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await this.usersService.resetPassword(user._id.toString(), hash);
    return { success: true, message: 'Password has been reset' };
  }
}
