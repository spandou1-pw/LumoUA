import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Post } from './entities/post.entity';
import { PostMedia } from './entities/post-media.entity';
import { Bookmark } from './entities/bookmark.entity';
import { CreatePostDto, PostResponseDto, UpdatePostDto } from './dto/post.dto';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.dto';
import { FilesService } from '../files/files.service';
import { ReactionsService } from '../reactions/reactions.service';
import { PolicyService } from '../users/policy.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostMedia) private readonly postMedia: Repository<PostMedia>,
    @InjectRepository(Bookmark) private readonly bookmarks: Repository<Bookmark>,
    private readonly filesService: FilesService,
    private readonly reactionsService: ReactionsService,
    private readonly policy: PolicyService,
    private readonly events: EventEmitter2,
  ) {}

  async create(authorId: string, dto: CreatePostDto): Promise<Post> {
    const post = await this.posts.save(
      this.posts.create({
        authorId,
        body: dto.body ?? null,
        visibility: dto.visibility ?? 'default',
      }),
    );

    if (dto.mediaAssetIds?.length) {
      await Promise.all(
        dto.mediaAssetIds.map(async (assetId, position) => {
          await this.filesService.attachToOwner(assetId, post.id);
          await this.postMedia.insert({ postId: post.id, mediaAssetId: assetId, position });
        }),
      );
    }

    this.events.emit('post.created', { post });
    return post;
  }

  private async findOwnedOrThrow(postId: string, requesterId: string): Promise<Post> {
    const post = await this.posts.findOne({ where: { id: postId, deletedAt: IsNull() } });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');
    if (post.authorId !== requesterId) throw new ForbiddenException('NOT_YOUR_POST'); // doc 24
    return post;
  }

  async update(postId: string, requesterId: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findOwnedOrThrow(postId, requesterId);
    if (dto.body !== undefined) post.body = dto.body;
    return this.posts.save(post);
  }

  async softDelete(postId: string, requesterId: string): Promise<void> {
    const post = await this.findOwnedOrThrow(postId, requesterId);
    post.deletedAt = new Date();
    await this.posts.save(post);
  }

  /**
   * doc 32/ADMIN.md: moderator/admin content removal — distinct method
   * from the author's own `softDelete` (no ownership check; the caller,
   * ModerationActionsService, has already verified the requester's role).
   * Returns the post's authorId so the caller can notify them with the
   * specific violation, per doc 32's "specificity matters" rule.
   */
  async moderatorRemove(postId: string): Promise<{ authorId: string }> {
    const post = await this.posts.findOne({ where: { id: postId, deletedAt: IsNull() } });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');
    post.deletedAt = new Date();
    await this.posts.save(post);
    return { authorId: post.authorId };
  }

  async bookmark(userId: string, postId: string): Promise<void> {
    await this.bookmarks.upsert({ userId, postId }, ['userId', 'postId']);
  }

  async unbookmark(userId: string, postId: string): Promise<void> {
    await this.bookmarks.delete({ userId, postId });
  }

  /** doc 20/22: single post, with viewer-specific engagement state assembled server-side. */
  async getById(viewerId: string, postId: string): Promise<PostResponseDto> {
    const post = await this.posts.findOne({ where: { id: postId, deletedAt: IsNull() } });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');

    if (post.authorId !== viewerId) {
      const canView = await this.policy.canViewProfileContent(viewerId, post.authorId);
      if (!canView) throw new NotFoundException('POST_NOT_FOUND'); // 404, not 403 (doc 24 pattern)
    }

    return this.assemble(viewerId, [post]).then((rows) => rows[0]);
  }

  /** doc 20: profile timeline query, cursor-paginated (doc 22). */
  async listByAuthor(
    viewerId: string,
    authorId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResult<PostResponseDto>> {
    const canView = await this.policy.canViewProfileContent(viewerId, authorId);
    if (!canView) return { items: [], nextCursor: null };

    const qb = this.posts
      .createQueryBuilder('p')
      .where('p.author_id = :authorId', { authorId })
      .andWhere('p.deleted_at IS NULL')
      .orderBy('p.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('p.created_at < :cursor', { cursor: new Date(cursor) });

    const rows = await qb.getMany();
    const { items, nextCursor } = paginate(rows, limit);
    return { items: await this.assemble(viewerId, items), nextCursor };
  }

  /**
   * doc 27 "Feed Item Assembly": resolves engagement state (liked/bookmarked)
   * and counts in batched queries — avoids N+1 across a page of results.
   * Reused by FeedService so feed and profile-timeline responses share the
   * exact same assembly logic (doc 40 consistency rule).
   */
  async assemble(viewerId: string, posts: Post[]): Promise<PostResponseDto[]> {
    if (posts.length === 0) return [];
    const postIds = posts.map((p) => p.id);

    const [likeCounts, viewerLiked, viewerBookmarked, commentCounts] = await Promise.all([
      this.reactionsService.countMany('post', postIds),
      this.reactionsService.viewerLikedSet(viewerId, 'post', postIds),
      this.bookmarks.find({ where: postIds.map((postId) => ({ userId: viewerId, postId })) }),
      this.commentCountsFor(postIds),
    ]);
    const bookmarkedSet = new Set(viewerBookmarked.map((b) => b.postId));

    return posts.map((p) => ({
      id: p.id,
      authorId: p.authorId,
      body: p.body,
      visibility: p.visibility,
      createdAt: p.createdAt,
      likeCount: likeCounts.get(p.id) ?? 0,
      commentCount: commentCounts.get(p.id) ?? 0,
      viewerHasLiked: viewerLiked.has(p.id),
      viewerHasBookmarked: bookmarkedSet.has(p.id),
    }));
  }

  private async commentCountsFor(postIds: string[]): Promise<Map<string, number>> {
    if (postIds.length === 0) return new Map();
    const rows = await this.posts.manager
      .createQueryBuilder()
      .select('comment.post_id', 'postId')
      .addSelect('COUNT(*)', 'count')
      .from('comments', 'comment')
      .where('comment.post_id IN (:...postIds)', { postIds })
      .andWhere('comment.deleted_at IS NULL')
      .groupBy('comment.post_id')
      .getRawMany<{ postId: string; count: string }>();
    return new Map(rows.map((r) => [r.postId, Number(r.count)]));
  }

  /** Internal accessor used by FeedService for the reverse-chronological query (doc 27). */
  async findRawByAuthors(authorIds: string[], cursor?: string, limit = 20): Promise<Post[]> {
    if (authorIds.length === 0) return [];
    const qb = this.posts
      .createQueryBuilder('p')
      .where('p.author_id IN (:...authorIds)', { authorIds })
      .andWhere('p.deleted_at IS NULL')
      .orderBy('p.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('p.created_at < :cursor', { cursor: new Date(cursor) });
    return qb.getMany();
  }

  async findAllPublicRaw(cursor?: string, limit = 20): Promise<Post[]> {
    const qb = this.posts
      .createQueryBuilder('p')
      .andWhere('p.deleted_at IS NULL')
      .orderBy('p.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('p.created_at < :cursor', { cursor: new Date(cursor) });
    return qb.getMany();
  }
}
