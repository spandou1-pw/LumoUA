import { CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { FeedService } from './feed.service';
import { PostResponseDto } from '../posts/dto/post.dto';

@ApiTags('Feed')
@ApiBearerAuth()
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('following')
  @CacheTTL(30_000) // doc 27
  @ApiOperation({ summary: 'Following feed — reverse-chronological, fan-out-on-read (doc 27)' })
  @ApiOkResponse({ type: [PostResponseDto] })
  async following(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.feedService.following(userId, pagination.cursor, pagination.limit);
  }

  @Get('global')
  @CacheTTL(30_000)
  @ApiOperation({ summary: 'Global feed — all public posts, basic exclusions (doc 27)' })
  @ApiOkResponse({ type: [PostResponseDto] })
  async global(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.feedService.global(userId, pagination.cursor, pagination.limit);
  }
}
