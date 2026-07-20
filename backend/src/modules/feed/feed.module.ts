import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../users/entities/follow.entity';
import { Mute } from '../users/entities/mute.entity';
import { Block } from '../users/entities/block.entity';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { FeedResolver } from './feed.resolver';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, Mute, Block]), PostsModule],
  controllers: [FeedController],
  providers: [FeedService, FeedResolver],
  exports: [FeedService],
})
export class FeedModule {}
