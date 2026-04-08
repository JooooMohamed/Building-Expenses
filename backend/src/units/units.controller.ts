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
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, AssignResidentDto } from './dto/create-unit.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

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
    @Body() dto: CreateUnitDto,
  ) {
    return this.unitsService.create(buildingId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitsService.update(id, dto);
  }

  @Patch(':id/assign')
  assign(
    @Param('id', ParseObjectIdPipe) unitId: string,
    @Body() dto: AssignResidentDto,
  ) {
    return this.unitsService.assignResident(unitId, dto.residentId);
  }

  @Patch(':id/unassign')
  unassign(@Param('id', ParseObjectIdPipe) unitId: string) {
    return this.unitsService.unassignResident(unitId);
  }
}
