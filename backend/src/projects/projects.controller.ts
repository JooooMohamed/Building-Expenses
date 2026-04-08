import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // Admin endpoints
  @Post('admin/projects')
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    const data = {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    };
    return this.projectsService.create(buildingId, userId, data);
  }

  @Get('admin/projects')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAll(@CurrentUser('buildingId') buildingId: string) {
    return this.projectsService.findByBuilding(buildingId);
  }

  @Patch('admin/projects/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const data = {
      ...dto,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
    return this.projectsService.update(id, data);
  }

  // Resident-visible endpoint (read-only)
  @Get('building/projects')
  getPublicProjects(@CurrentUser('buildingId') buildingId: string) {
    return this.projectsService.findByBuilding(buildingId);
  }
}
