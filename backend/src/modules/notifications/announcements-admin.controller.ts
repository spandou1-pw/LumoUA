import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnnouncementsService } from './announcements.service';

@ApiTags('Admin — Push Notifications')
@ApiBearerAuth()
@Controller('admin/announcements')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class AnnouncementsAdminController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @ApiOperation({ summary: 'Broadcast a push notification to every active user (doc 04 ADMIN-4), dispatched via a background job' })
  async create(@CurrentUser('id') actorId: string, @Body('title') title: string, @Body('body') body: string) {
    return this.announcementsService.create(actorId, title, body);
  }

  @Get()
  @ApiOperation({ summary: 'Recent announcements and their delivery status' })
  async list() {
    return this.announcementsService.listRecent();
  }
}
