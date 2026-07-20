import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreatorDashboardService } from './creator-dashboard.service';
import { CommunityGrowthService } from './community-growth.service';

@ApiTags('Creator Dashboard')
@ApiBearerAuth()
@Controller()
export class CreatorDashboardController {
  constructor(
    private readonly creatorDashboard: CreatorDashboardService,
    private readonly communityGrowth: CommunityGrowthService,
  ) {}

  @Get('creator-dashboard/overview')
  @ApiOperation({ summary: 'Your own content/audience/gifts overview (read-only — not a payout mechanism, see GROWTH.md)' })
  async overview(@CurrentUser('id') userId: string, @Query('days') days = 30) {
    return this.creatorDashboard.overview(userId, Number(days));
  }

  @Get('communities/:id/growth')
  @ApiOperation({ summary: 'Community Growth — member count over time' })
  async getCommunityGrowth(@Param('id') communityId: string, @Query('days') days = 90) {
    return this.communityGrowth.growthOverTime(communityId, Number(days));
  }
}
