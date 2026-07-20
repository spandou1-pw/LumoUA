import { Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGeneral } from '../../common/decorators/rate-limit.decorator';
import { ReactionsService } from './reactions.service';

@ApiTags('Reactions')
@ApiBearerAuth()
@Controller()
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('posts/:id/like')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Like a post (doc 04 POST-5)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async likePost(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.reactionsService.like(userId, 'post', id);
    return { liked: true };
  }

  @Delete('posts/:id/like')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Unlike a post' })
  async unlikePost(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.reactionsService.unlike(userId, 'post', id);
    return { liked: false };
  }

  @Post('comments/:id/like')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Like a comment' })
  async likeComment(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.reactionsService.like(userId, 'comment', id);
    return { liked: true };
  }

  @Delete('comments/:id/like')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Unlike a comment' })
  async unlikeComment(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.reactionsService.unlike(userId, 'comment', id);
    return { liked: false };
  }
}
