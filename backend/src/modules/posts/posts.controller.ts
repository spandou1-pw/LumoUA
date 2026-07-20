import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGeneral } from '../../common/decorators/rate-limit.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { PostsService } from './posts.service';
import { CreatePostDto, PostResponseDto, UpdatePostDto } from './dto/post.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Create a post (doc 04 POST-1/POST-2)' })
  @ApiOkResponse({ type: PostResponseDto })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreatePostDto) {
    const post = await this.postsService.create(userId, dto);
    return this.postsService.getById(userId, post.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post, with viewer-specific engagement state' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: PostResponseDto })
  async getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.postsService.getById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit own post (doc 24: author only)' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    await this.postsService.update(id, userId, dto);
    return this.postsService.getById(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete own post (doc 24: author only)' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.postsService.softDelete(id, userId);
    return { deleted: true };
  }

  @HttpPost(':id/bookmark')
  @ApiOperation({ summary: 'Bookmark a post (doc 04 POST-7)' })
  async bookmark(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.postsService.bookmark(userId, id);
    return { bookmarked: true };
  }

  @Delete(':id/bookmark')
  @ApiOperation({ summary: 'Remove a bookmark' })
  async unbookmark(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.postsService.unbookmark(userId, id);
    return { bookmarked: false };
  }

  @Get('by-author/:authorId')
  @ApiOperation({ summary: "Author's post timeline (doc 20 profile timeline query), cursor-paginated" })
  @ApiOkResponse({ type: [PostResponseDto] })
  async listByAuthor(
    @CurrentUser('id') viewerId: string,
    @Param('authorId') authorId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.postsService.listByAuthor(viewerId, authorId, pagination.cursor, pagination.limit);
  }
}
