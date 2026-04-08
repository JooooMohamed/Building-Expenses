import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Get('building/announcements')
  getAll(
    @CurrentUser('buildingId') buildingId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.announcementsService.findByBuilding(buildingId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('admin/announcements')
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(
    @CurrentUser('buildingId') buildingId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(buildingId, userId, dto);
  }

  @Patch('admin/announcements/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, dto);
  }

  @Delete('admin/announcements/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.announcementsService.remove(id);
  }
}
