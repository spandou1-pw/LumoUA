import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CampaignsService } from './campaigns.service';
import { CampaignChannel, CampaignSegment } from './entities/campaign.entity';

@ApiTags('Admin — Campaigns')
@ApiBearerAuth()
@Controller('admin/campaigns')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class CampaignsAdminController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a segmented push or email campaign (doc GROWTH.md)' })
  async create(
    @CurrentUser('id') actorId: string,
    @Body('channel') channel: CampaignChannel,
    @Body('segment') segment: CampaignSegment,
    @Body('title') title: string,
    @Body('body') body: string,
  ) {
    return this.campaignsService.create(actorId, { channel, segment, title, body });
  }

  @Get()
  @ApiOperation({ summary: 'Recent campaigns and delivery status' })
  async list() {
    return this.campaignsService.listRecent();
  }
}
