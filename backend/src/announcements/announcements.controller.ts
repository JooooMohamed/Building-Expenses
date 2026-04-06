import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnnouncementsService } from './announcements.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Get('building/announcements')
  getAll(@CurrentUser('buildingId') buildingId: string) {
    return this.announcementsService.findByBuilding(buildingId);
  }

  @Post('admin/announcements')
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { title: string; body: string; priority?: string },
  ) {
    return this.announcementsService.create(buildingId, userId, body);
  }
}
