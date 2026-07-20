import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PremiumReaction, ReactionTargetType } from './entities/premium-reaction.entity';
import { PremiumService } from './premium.service';

/** doc: a small curated set rather than free-form emoji input — keeps rendering/moderation tractable. */
const ALLOWED_REACTION_EMOJI = new Set(['❤️', '😂', '😮', '😢', '👏', '🔥', '🎉']);

@Injectable()
export class PremiumReactionsService {
  constructor(
    @InjectRepository(PremiumReaction) private readonly reactions: Repository<PremiumReaction>,
    private readonly premium: PremiumService,
    private readonly events: EventEmitter2,
  ) {}

  async react(userId: string, targetType: ReactionTargetType, targetId: string, emoji: string): Promise<void> {
    if (!(await this.premium.isPremium(userId))) {
      throw new ForbiddenException('PREMIUM_SUBSCRIPTION_REQUIRED');
    }
    if (!ALLOWED_REACTION_EMOJI.has(emoji)) {
      throw new ForbiddenException('UNSUPPORTED_REACTION_EMOJI');
    }

    await this.reactions.upsert({ userId, targetType, targetId, emoji }, ['userId', 'targetType', 'targetId']);
    this.events.emit('premium_reaction.created', { userId, targetType, targetId, emoji });
  }

  async remove(userId: string, targetType: ReactionTargetType, targetId: string): Promise<void> {
    await this.reactions.delete({ userId, targetType, targetId });
  }

  /** doc 27 feed-item-assembly pattern: batched per-target reaction breakdown, avoids N+1. */
  async breakdownForTargets(
    targetType: ReactionTargetType,
    targetIds: string[],
  ): Promise<Map<string, { emoji: string; count: number }[]>> {
    if (targetIds.length === 0) return new Map();
    const rows = await this.reactions
      .createQueryBuilder('r')
      .select('r.target_id', 'targetId')
      .addSelect('r.emoji', 'emoji')
      .addSelect('COUNT(*)', 'count')
      .where('r.target_type = :targetType', { targetType })
      .andWhere('r.target_id IN (:...targetIds)', { targetIds })
      .groupBy('r.target_id')
      .addGroupBy('r.emoji')
      .getRawMany<{ targetId: string; emoji: string; count: string }>();

    const result = new Map<string, { emoji: string; count: number }[]>();
    for (const row of rows) {
      const list = result.get(row.targetId) ?? [];
      list.push({ emoji: row.emoji, count: Number(row.count) });
      result.set(row.targetId, list);
    }
    return result;
  }

  listAllowedEmoji(): string[] {
    return Array.from(ALLOWED_REACTION_EMOJI);
  }
}
