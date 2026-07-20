import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Comment } from './entities/comment.entity';
import { CommentResponseDto, CreateCommentDto } from './dto/comment.dto';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.dto';
import { ReactionsService } from '../reactions/reactions.service';
import { PlatformRole } from '../../common/enums/role.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    private readonly reactionsService: ReactionsService,
    private readonly events: EventEmitter2,
  ) {}

  async create(authorId: string, postId: string, dto: CreateCommentDto): Promise<Comment> {
    const comment = await this.comments.save(
      this.comments.create({ postId, authorId, body: dto.body }),
    );
    this.events.emit('comment.created', { comment });
    return comment;
  }

  async listForPost(
    viewerId: string,
    postId: string,
    cursor?: string,
    limit = 30,
  ): Promise<PaginatedResult<CommentResponseDto>> {
    const qb = this.comments
      .createQueryBuilder('c')
      .where('c.post_id = :postId', { postId })
      .andWhere('c.deleted_at IS NULL')
      .orderBy('c.created_at', 'ASC') // comment threads read oldest-first (doc 09)
      .take(limit + 1);
    if (cursor) qb.andWhere('c.created_at > :cursor', { cursor: new Date(cursor) });

    const rows = await qb.getMany();
    const { items, nextCursor } = paginate(rows, limit);

    const ids = items.map((c) => c.id);
    const [likeCounts, viewerLiked] = await Promise.all([
      this.reactionsService.countMany('comment', ids),
      this.reactionsService.viewerLikedSet(viewerId, 'comment', ids),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        postId: c.postId,
        authorId: c.authorId,
        body: c.body,
        createdAt: c.createdAt,
        likeCount: likeCounts.get(c.id) ?? 0,
        viewerHasLiked: viewerLiked.has(c.id),
      })),
      nextCursor,
    };
  }

  /**
   * doc 24: author OR moderator/admin (moderation removal). doc 32 requires
   * the removed-content notice to state the specific rule violated when a
   * moderator acts — that copy is assembled by the moderation module in a
   * later milestone; this method just enforces who may delete.
   */
  async remove(commentId: string, requesterId: string, requesterRole: PlatformRole): Promise<{ authorId: string }> {
    const comment = await this.comments.findOne({ where: { id: commentId, deletedAt: IsNull() } });
    if (!comment) throw new NotFoundException('COMMENT_NOT_FOUND');

    const isOwner = comment.authorId === requesterId;
    const isModerator = requesterRole === PlatformRole.MODERATOR || requesterRole === PlatformRole.ADMIN;
    if (!isOwner && !isModerator) throw new ForbiddenException('NOT_ALLOWED');

    comment.deletedAt = new Date();
    await this.comments.save(comment);
    return { authorId: comment.authorId };
  }
}
