import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnitsService } from './units.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin/units')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class UnitsController {
  constructor(private unitsService: UnitsService) {}

  @Get()
  findAll(@CurrentUser('buildingId') buildingId: string) {
    return this.unitsService.findByBuilding(buildingId);
  }

  @Post()
  create(
    @CurrentUser('buildingId') buildingId: string,
    @Body() body: { unitNumber: string; floor: number; area?: number; shareCoefficient?: number; type?: string },
  ) {
    return this.unitsService.create(buildingId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ unitNumber: string; floor: number; area: number; shareCoefficient: number }>) {
    return this.unitsService.update(id, body);
  }

  @Patch(':id/assign')
  assign(@Param('id') unitId: string, @Body('residentId') residentId: string) {
    return this.unitsService.assignResident(unitId, residentId);
  }
}
