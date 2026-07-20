import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../../posts/entities/post.entity';
import { Follow } from '../../users/entities/follow.entity';
import { GiftTransaction } from '../../gifts/entities/gift-transaction.entity';
import { Like } from '../../reactions/entities/like.entity';
import { CommunityMember } from '../../communities/entities/community-member.entity';
import { CreatorDashboardService } from './creator-dashboard.service';
import { CommunityGrowthService } from './community-growth.service';
import { CreatorDashboardController } from './creator-dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Follow, GiftTransaction, Like, CommunityMember])],
  controllers: [CreatorDashboardController],
  providers: [CreatorDashboardService, CommunityGrowthService],
})
export class CreatorDashboardModule {}
