import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ── Admin endpoints ──────────────────────────────

  @Get('admin/residents')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll(@CurrentUser('buildingId') buildingId: string) {
    return this.usersService.findByBuilding(buildingId, 'resident');
  }

  @Get('admin/residents/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('admin/residents')
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(
    @CurrentUser('buildingId') buildingId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(buildingId, { ...dto, role: 'resident' });
  }

  @Patch('admin/residents/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete('admin/residents/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  // ── Resident self-service ──────────────────────

  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    // Only allow safe fields
    return this.usersService.updateProfile(userId, {
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @Patch('me/payment-frequency')
  updatePaymentFrequency(
    @CurrentUser('userId') userId: string,
    @Body('paymentFrequency') frequency: string,
  ) {
    return this.usersService.update(userId, { paymentFrequency: frequency });
  }
}
