import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin/projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  getAll(@CurrentUser('buildingId') buildingId: string) {
    return this.projectsService.findByBuilding(buildingId);
  }

  @Post()
  create(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { title: string; description?: string; estimatedCost: number; startDate?: string },
  ) {
    const data = {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
    };
    return this.projectsService.create(buildingId, userId, data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{ title: string; status: string; actualCost: number; endDate: string }>,
  ) {
    const data = {
      ...body,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    };
    return this.projectsService.update(id, data);
  }
}
