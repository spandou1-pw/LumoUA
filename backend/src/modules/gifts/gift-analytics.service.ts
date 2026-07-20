import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GiftTransaction } from './entities/gift-transaction.entity';
import { GiftCatalogItem } from './entities/gift-catalog-item.entity';

@Injectable()
export class GiftAnalyticsService {
  constructor(
    @InjectRepository(GiftTransaction) private readonly giftTransactions: Repository<GiftTransaction>,
    @InjectRepository(GiftCatalogItem) private readonly items: Repository<GiftCatalogItem>,
  ) {}

  async topGiftsSent(sinceDays = 30, limit = 10) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.giftTransactions
      .createQueryBuilder('g')
      .select('g.gift_catalog_item_id', 'itemId')
      .addSelect('COUNT(*)', 'sendCount')
      .addSelect('SUM(g.coin_cost)', 'totalCoinsSpent')
      .where('g.created_at > :since', { since })
      .groupBy('g.gift_catalog_item_id')
      .orderBy('"sendCount"', 'DESC')
      .limit(limit)
      .getRawMany<{ itemId: string; sendCount: string; totalCoinsSpent: string }>();

    const itemIds = rows.map((r) => r.itemId);
    const items = itemIds.length ? await this.items.find({ where: { id: In(itemIds) } }) : [];
    const itemsById = new Map(items.map((i) => [i.id, i]));

    return rows.map((r) => ({
      item: itemsById.get(r.itemId) ?? null,
      sendCount: Number(r.sendCount),
      totalCoinsSpent: Number(r.totalCoinsSpent),
    }));
  }

  async rarityDistribution(sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.giftTransactions
      .createQueryBuilder('g')
      .innerJoin(GiftCatalogItem, 'item', 'item.id = g.gift_catalog_item_id')
      .select('item.rarity', 'rarity')
      .addSelect('COUNT(*)', 'sendCount')
      .where('g.created_at > :since', { since })
      .groupBy('item.rarity')
      .getRawMany<{ rarity: string; sendCount: string }>();
    return rows.map((r) => ({ rarity: r.rarity, sendCount: Number(r.sendCount) }));
  }

  async seasonalPerformance(seasonTag: string) {
    const rows = await this.giftTransactions
      .createQueryBuilder('g')
      .innerJoin(GiftCatalogItem, 'item', 'item.id = g.gift_catalog_item_id')
      .select('item.id', 'itemId')
      .addSelect('item.name', 'itemName')
      .addSelect('COUNT(*)', 'sendCount')
      .addSelect('SUM(g.coin_cost)', 'totalCoinsSpent')
      .where('item.season_tag = :seasonTag', { seasonTag })
      .groupBy('item.id')
      .addGroupBy('item.name')
      .orderBy('"sendCount"', 'DESC')
      .getRawMany<{ itemId: string; itemName: string; sendCount: string; totalCoinsSpent: string }>();
    return rows.map((r) => ({
      itemId: r.itemId,
      itemName: r.itemName,
      sendCount: Number(r.sendCount),
      totalCoinsSpent: Number(r.totalCoinsSpent),
    }));
  }

  /** How many top-level senders/recipients exist — a light engagement signal distinct from revenue (Stage 6 covers revenue). */
  async uniqueSendersAndRecipients(sinceDays = 30): Promise<{ uniqueSenders: number; uniqueRecipients: number }> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const [senders, recipients] = await Promise.all([
      this.giftTransactions
        .createQueryBuilder('g')
        .select('COUNT(DISTINCT g.sender_id)', 'count')
        .where('g.created_at > :since', { since })
        .getRawOne<{ count: string }>(),
      this.giftTransactions
        .createQueryBuilder('g')
        .select('COUNT(DISTINCT g.recipient_id)', 'count')
        .where('g.created_at > :since', { since })
        .getRawOne<{ count: string }>(),
    ]);
    return {
      uniqueSenders: Number(senders?.count ?? 0),
      uniqueRecipients: Number(recipients?.count ?? 0),
    };
  }
}
