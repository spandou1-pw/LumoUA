import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../../users/entities/follow.entity';
import { Block } from '../../users/entities/block.entity';
import { FeedEvent } from './entities/feed-event.entity';
import { FriendRecommendationsService } from './friend-recommendations.service';
import { FeedRankingService } from './feed-ranking.service';
import { SearchRankingService } from './search-ranking.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, Block, FeedEvent])],
  controllers: [RecommendationsController],
  providers: [FriendRecommendationsService, FeedRankingService, SearchRankingService],
  exports: [FriendRecommendationsService, FeedRankingService, SearchRankingService],
})
export class RecommendationsModule {}
