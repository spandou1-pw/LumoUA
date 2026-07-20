import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGeneral } from '../../common/decorators/rate-limit.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CommentsService } from './comments.service';
import { CommentResponseDto, CreateCommentDto } from './dto/comment.dto';
import { PlatformRole } from '../../common/enums/role.enum';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Comment on a post (doc 04 POST-4)' })
  @ApiParam({ name: 'postId' })
  async create(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, postId, dto);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'List comments for a post, cursor-paginated' })
  @ApiOkResponse({ type: [CommentResponseDto] })
  async list(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.commentsService.listForPost(userId, postId, pagination.cursor, pagination.limit);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete a comment (doc 24: author or moderator/admin)' })
  async remove(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: PlatformRole,
    @Param('id') id: string,
  ) {
    await this.commentsService.remove(id, userId, role);
    return { deleted: true };
  }
}
