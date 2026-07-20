import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserCosmeticSelection } from './entities/user-cosmetic-selection.entity';
import { CosmeticItem, CosmeticCategory } from './entities/cosmetic-item.entity';
import { PremiumReaction } from './entities/premium-reaction.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class PremiumAnalyticsService {
  constructor(
    @InjectRepository(UserCosmeticSelection) private readonly selections: Repository<UserCosmeticSelection>,
    @InjectRepository(CosmeticItem) private readonly items: Repository<CosmeticItem>,
    @InjectRepository(PremiumReaction) private readonly premiumReactions: Repository<PremiumReaction>,
    @InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
  ) {}

  /** Which cosmetic items are actually being used, per category — informs future catalog decisions. */
  async mostPopularCosmetics(category: CosmeticCategory, limit = 10) {
    const rows = await this.selections
      .createQueryBuilder('s')
      .select('s.cosmetic_item_id', 'cosmeticItemId')
      .addSelect('COUNT(*)', 'selectionCount')
      .where('s.category = :category', { category })
      .groupBy('s.cosmetic_item_id')
      .orderBy('"selectionCount"', 'DESC')
      .limit(limit)
      .getRawMany<{ cosmeticItemId: string; selectionCount: string }>();

    const itemIds = rows.map((r) => r.cosmeticItemId);
    const items = itemIds.length ? await this.items.findBy({ id: In(itemIds) }) : [];
    const itemsById = new Map(items.map((i) => [i.id, i]));

    return rows.map((r) => ({
      item: itemsById.get(r.cosmeticItemId) ?? null,
      selectionCount: Number(r.selectionCount),
    }));
  }

  /** doc: what fraction of currently-active premium subscribers have customized at least one cosmetic — a feature-adoption signal, not a revenue one (that's PaymentAnalyticsService, Stage 6). */
  async cosmeticAdoptionRate(): Promise<{ activeSubscribers: number; usersWithAnySelection: number; adoptionRate: number }> {
    const [activeSubscribers, usersWithAnySelection] = await Promise.all([
      this.subscriptions.count({ where: [{ status: 'active' }, { status: 'grace_period' }] }),
      this.selections.createQueryBuilder('s').select('COUNT(DISTINCT s.user_id)', 'count').getRawOne<{ count: string }>()
        .then((r) => Number(r?.count ?? 0)),
    ]);
    return {
      activeSubscribers,
      usersWithAnySelection,
      adoptionRate: activeSubscribers > 0 ? usersWithAnySelection / activeSubscribers : 0,
    };
  }

  async premiumReactionUsage(sinceDays = 30): Promise<{ emoji: string; count: number }[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.premiumReactions
      .createQueryBuilder('r')
      .select('r.emoji', 'emoji')
      .addSelect('COUNT(*)', 'count')
      .where('r.created_at > :since', { since })
      .groupBy('r.emoji')
      .orderBy('count', 'DESC')
      .getRawMany<{ emoji: string; count: string }>();
    return rows.map((r) => ({ emoji: r.emoji, count: Number(r.count) }));
  }
}
