import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Follow } from '../users/entities/follow.entity';
import { Mute } from '../users/entities/mute.entity';
import { Block } from '../users/entities/block.entity';
import { PostsService } from '../posts/posts.service';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.dto';
import { PostResponseDto } from '../posts/dto/post.dto';

const FEED_CACHE_TTL_MS = 30_000; // doc 27: ~30-60s

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(Mute) private readonly mutes: Repository<Mute>,
    @InjectRepository(Block) private readonly blocks: Repository<Block>,
    private readonly postsService: PostsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * doc 27: fan-out-on-read for Phase 1 — query posts from followed users at
   * request time. Excludes muted authors (doc 27 "Content Exclusion Rules");
   * blocked users are excluded in both feed types.
   */
  async following(viewerId: string, cursor?: string, limit = 20): Promise<PaginatedResult<PostResponseDto>> {
    const cacheKey = `feed:following:${viewerId}:${cursor ?? 'start'}:${limit}`;
    const cached = await this.cache.get<PaginatedResult<PostResponseDto>>(cacheKey);
    if (cached) return cached;

    const [followedRows, mutedRows, blockedRows] = await Promise.all([
      this.follows.find({ where: { followerId: viewerId } }),
      this.mutes.find({ where: { muterId: viewerId } }),
      this.blocks.find({ where: [{ blockerId: viewerId }, { blockedId: viewerId }] }),
    ]);

    const mutedIds = new Set(mutedRows.map((m) => m.mutedId));
    const blockedIds = new Set(
      blockedRows.map((b) => (b.blockerId === viewerId ? b.blockedId : b.blockerId)),
    );
    const authorIds = followedRows
      .map((f) => f.followeeId)
      .filter((id) => !mutedIds.has(id) && !blockedIds.has(id));

    const rawPosts = await this.postsService.findRawByAuthors(authorIds, cursor, limit);
    const { items, nextCursor } = paginate(rawPosts, limit);
    const assembled = await this.postsService.assemble(viewerId, items);

    const result = { items: assembled, nextCursor };
    await this.cache.set(cacheKey, result, FEED_CACHE_TTL_MS);
    return result;
  }

  /** doc 27: Global feed — same reverse-chronological approach, basic exclusions only. */
  async global(viewerId: string, cursor?: string, limit = 20): Promise<PaginatedResult<PostResponseDto>> {
    const cacheKey = `feed:global:${viewerId}:${cursor ?? 'start'}:${limit}`;
    const cached = await this.cache.get<PaginatedResult<PostResponseDto>>(cacheKey);
    if (cached) return cached;

    const blockedRows = await this.blocks.find({
      where: [{ blockerId: viewerId }, { blockedId: viewerId }],
    });
    const blockedIds = new Set(
      blockedRows.map((b) => (b.blockerId === viewerId ? b.blockedId : b.blockerId)),
    );

    const rawPosts = (await this.postsService.findAllPublicRaw(cursor, limit)).filter(
      (p) => !blockedIds.has(p.authorId),
    );
    const { items, nextCursor } = paginate(rawPosts, limit);
    const assembled = await this.postsService.assemble(viewerId, items);

    const result = { items: assembled, nextCursor };
    await this.cache.set(cacheKey, result, FEED_CACHE_TTL_MS);
    return result;
  }
}
