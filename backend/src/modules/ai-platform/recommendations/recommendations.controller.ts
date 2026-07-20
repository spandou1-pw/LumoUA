import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FriendRecommendationsService } from './friend-recommendations.service';
import { FeedRankingService } from './feed-ranking.service';
import { FeedEventType } from './entities/feed-event.entity';

@ApiTags('Recommendations')
@ApiBearerAuth()
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly friendRecommendations: FriendRecommendationsService,
    private readonly feedRanking: FeedRankingService,
  ) {}

  @Get('friends')
  @ApiOperation({ summary: 'People you may know — mutual-connections graph algorithm (doc AI.md)' })
  async friends(@CurrentUser('id') userId: string) {
    return this.friendRecommendations.suggest(userId);
  }

  @Post('feed-events')
  @ApiOperation({ summary: 'Log a feed interaction event (doc 28 groundwork) — impressions, likes, and explicit negative signals' })
  async logFeedEvent(
    @CurrentUser('id') userId: string,
    @Body('postId') postId: string,
    @Body('eventType') eventType: FeedEventType,
    @Body('position') position?: number,
    @Body('feedType') feedType?: 'following' | 'global',
  ) {
    await this.feedRanking.logEvent(userId, postId, eventType, { position, feedType });
    return { logged: true };
  }
}
