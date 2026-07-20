import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Like, LikeTargetType } from './entities/like.entity';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    private readonly events: EventEmitter2,
  ) {}

  async like(userId: string, targetType: LikeTargetType, targetId: string): Promise<void> {
    const existing = await this.likes.exist({ where: { userId, targetType, targetId } });
    if (existing) return; // idempotent
    await this.likes.insert({ userId, targetType, targetId });
    // doc 25: notification dispatch subscribes to this event; doesn't sit
    // inline in the write path.
    this.events.emit('reaction.created', { userId, targetType, targetId });
  }

  async unlike(userId: string, targetType: LikeTargetType, targetId: string): Promise<void> {
    await this.likes.delete({ userId, targetType, targetId });
  }

  async count(targetType: LikeTargetType, targetId: string): Promise<number> {
    return this.likes.count({ where: { targetType, targetId } });
  }

  async countMany(targetType: LikeTargetType, targetIds: string[]): Promise<Map<string, number>> {
    if (targetIds.length === 0) return new Map();
    const rows = await this.likes
      .createQueryBuilder('l')
      .select('l.target_id', 'targetId')
      .addSelect('COUNT(*)', 'count')
      .where('l.target_type = :targetType', { targetType })
      .andWhere('l.target_id IN (:...targetIds)', { targetIds })
      .groupBy('l.target_id')
      .getRawMany<{ targetId: string; count: string }>();
    return new Map(rows.map((r) => [r.targetId, Number(r.count)]));
  }

  async hasLiked(userId: string, targetType: LikeTargetType, targetId: string): Promise<boolean> {
    return this.likes.exist({ where: { userId, targetType, targetId } });
  }

  /** doc 27 feed-item-assembly: batched per-viewer liked-state, avoids N+1. */
  async viewerLikedSet(
    userId: string,
    targetType: LikeTargetType,
    targetIds: string[],
  ): Promise<Set<string>> {
    if (targetIds.length === 0) return new Set();
    const rows = await this.likes.find({
      where: targetIds.map((targetId) => ({ userId, targetType, targetId })),
    });
    return new Set(rows.map((r) => r.targetId));
  }
}
