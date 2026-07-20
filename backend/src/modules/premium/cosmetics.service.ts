import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CosmeticItem, CosmeticCategory } from './entities/cosmetic-item.entity';
import { UserCosmeticSelection } from './entities/user-cosmetic-selection.entity';
import { PremiumService } from './premium.service';

/**
 * Covers: Premium Badge, Animated Badge, Badge Selector, Profile Themes,
 * Premium Frames, Animated Frames, Premium Username Colors, Premium
 * Wallpapers, Premium Profile Effects — all "pick one active item per
 * category" cosmetics share this one service (doc PREMIUM.md's
 * unification rationale).
 */
@Injectable()
export class CosmeticsService {
  constructor(
    @InjectRepository(CosmeticItem) private readonly items: Repository<CosmeticItem>,
    @InjectRepository(UserCosmeticSelection) private readonly selections: Repository<UserCosmeticSelection>,
    private readonly premium: PremiumService,
  ) {}

  async listCatalog(category: CosmeticCategory): Promise<CosmeticItem[]> {
    return this.items.find({ where: { category, active: true }, order: { sortOrder: 'ASC' } });
  }

  /** doc: "Animated Badge"/"Animated Frames" are just items with isAnimated=true in the same catalog — no separate endpoint needed. */
  async listAnimatedCatalog(category: CosmeticCategory): Promise<CosmeticItem[]> {
    return this.items.find({
      where: { category, active: true, isAnimated: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /** doc: "Badge Selector" and its siblings — select an item, verifying premium access if the item requires it. */
  async select(userId: string, category: CosmeticCategory, cosmeticItemId: string): Promise<UserCosmeticSelection> {
    const item = await this.items.findOne({ where: { id: cosmeticItemId, category, active: true } });
    if (!item) throw new NotFoundException('COSMETIC_ITEM_NOT_FOUND');

    if (item.requiresPremium && !(await this.premium.isPremium(userId))) {
      throw new ForbiddenException('PREMIUM_SUBSCRIPTION_REQUIRED');
    }

    const existing = await this.selections.findOne({ where: { userId, category } });
    if (existing) {
      existing.cosmeticItemId = item.id;
      return this.selections.save(existing);
    }
    return this.selections.save(this.selections.create({ userId, category, cosmeticItemId: item.id }));
  }

  async clearSelection(userId: string, category: CosmeticCategory): Promise<void> {
    await this.selections.delete({ userId, category });
  }

  /** doc: "Status beside username" reads badge/username_color alongside profile — this returns every category's current pick in one call. */
  async getSelectionsForUser(userId: string): Promise<Record<CosmeticCategory, CosmeticItem | null>> {
    const rows = await this.selections.find({ where: { userId } });
    const itemIds = rows.map((r) => r.cosmeticItemId);
    const items = itemIds.length ? await this.items.find({ where: { id: In(itemIds) } }) : [];
    const itemsById = new Map(items.map((i) => [i.id, i]));

    const result: Record<string, CosmeticItem | null> = {
      badge: null,
      frame: null,
      theme: null,
      username_color: null,
      wallpaper: null,
      profile_effect: null,
      banner: null,
      status_icon: null,
    };
    for (const row of rows) {
      result[row.category] = itemsById.get(row.cosmeticItemId) ?? null;
    }
    return result as Record<CosmeticCategory, CosmeticItem | null>;
  }

  /**
   * doc: what other modules (Users/Posts/Feed) call to enrich an author's
   * display info — badge + username color + animated flags, the minimal
   * set needed to render "badge and colored name beside a post/comment"
   * without pulling every cosmetic category.
   */
  async getDisplayBundle(userId: string): Promise<{
    isPremium: boolean;
    badge: CosmeticItem | null;
    usernameColor: CosmeticItem | null;
  }> {
    const [isPremium, badgeSel, colorSel] = await Promise.all([
      this.premium.isPremium(userId),
      this.selections.findOne({ where: { userId, category: 'badge' } }),
      this.selections.findOne({ where: { userId, category: 'username_color' } }),
    ]);
    const [badge, usernameColor] = await Promise.all([
      badgeSel ? this.items.findOne({ where: { id: badgeSel.cosmeticItemId } }) : null,
      colorSel ? this.items.findOne({ where: { id: colorSel.cosmeticItemId } }) : null,
    ]);
    return { isPremium, badge: badge ?? null, usernameColor: usernameColor ?? null };
  }
}
