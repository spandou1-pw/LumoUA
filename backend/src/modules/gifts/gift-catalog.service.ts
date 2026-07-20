import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { GiftCatalogItem, GiftRarity } from './entities/gift-catalog-item.entity';
import { GiftCategory } from './entities/gift-category.entity';

export interface GiftCatalogFilter {
  categoryId?: string;
  rarity?: GiftRarity;
  seasonTag?: string;
  animatedOnly?: boolean;
  q?: string; // doc: "Gift Search"
}

@Injectable()
export class GiftCatalogService {
  constructor(
    @InjectRepository(GiftCatalogItem) private readonly items: Repository<GiftCatalogItem>,
    @InjectRepository(GiftCategory) private readonly categories: Repository<GiftCategory>,
  ) {}

  async listCategories(): Promise<GiftCategory[]> {
    return this.categories.find({ where: { active: true }, order: { sortOrder: 'ASC' } });
  }

  /**
   * doc: "Gift Store" — the main browsing endpoint. Always excludes items
   * that are outside their availability window or sold out (remaining_supply
   * = 0), regardless of `active` — an admin marking something active
   * doesn't override a genuinely expired seasonal window or exhausted
   * limited stock.
   */
  async browse(filter: GiftCatalogFilter): Promise<GiftCatalogItem[]> {
    const now = new Date();
    const qb = this.items.createQueryBuilder('g').where('g.active = true');

    qb.andWhere('(g.available_from IS NULL OR g.available_from <= :now)', { now });
    qb.andWhere('(g.available_until IS NULL OR g.available_until >= :now)', { now });
    qb.andWhere('(g.remaining_supply IS NULL OR g.remaining_supply > 0)');

    if (filter.categoryId) qb.andWhere('g.category_id = :categoryId', { categoryId: filter.categoryId });
    if (filter.rarity) qb.andWhere('g.rarity = :rarity', { rarity: filter.rarity });
    if (filter.seasonTag) qb.andWhere('g.season_tag = :seasonTag', { seasonTag: filter.seasonTag });
    if (filter.animatedOnly) qb.andWhere('g.is_animated = true');
    if (filter.q) qb.andWhere('g.name ILIKE :q', { q: `%${filter.q}%` });

    return qb.orderBy('g.rarity', 'DESC').addOrderBy('g.name', 'ASC').getMany();
  }

  /** doc: "Rare Gifts" / "Legendary Gifts" — dedicated shortcuts over browse() for the common UI filters. */
  async listByRarity(rarity: GiftRarity): Promise<GiftCatalogItem[]> {
    return this.browse({ rarity });
  }

  /** doc: "Seasonal Gifts" — currently-active seasonal items, grouped by season tag for a storefront carousel. */
  async listActiveSeasonal(): Promise<Record<string, GiftCatalogItem[]>> {
    const now = new Date();
    const items = await this.items.find({
      where: { active: true, availableUntil: MoreThan(now) },
    });
    const seasonal = items.filter((i) => i.seasonTag);
    const grouped: Record<string, GiftCatalogItem[]> = {};
    for (const item of seasonal) {
      const key = item.seasonTag as string;
      (grouped[key] ??= []).push(item);
    }
    return grouped;
  }

  async findOne(id: string): Promise<GiftCatalogItem | null> {
    return this.items.findOne({ where: { id } });
  }
}
