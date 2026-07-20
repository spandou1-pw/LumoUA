import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * doc PREMIUM.md: one table for every "pick one from a catalog" cosmetic
 * category, rather than ten near-identical tables (badge_catalog,
 * frame_catalog, theme_catalog, ...) that would all have the same shape
 * and the same selection logic. This mirrors the deliberate, scoped use of
 * a polymorphic pattern from doc 20 (likes/reports) — used here because
 * the categories genuinely share one lifecycle (catalog item -> user picks
 * one active item per category), not as a shortcut.
 *
 * Categories that DON'T fit "pick one" (sticker packs, emoji packs — a user
 * has access to a whole pack, not a single selection) are modeled
 * separately, not forced into this table (see PremiumAssetPack).
 */
export type CosmeticCategory =
  | 'badge'
  | 'frame'
  | 'theme'
  | 'username_color'
  | 'wallpaper'
  | 'profile_effect'
  | 'banner'
  | 'status_icon';

@Entity('cosmetic_items')
export class CosmeticItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  category: CosmeticCategory;

  @Column()
  name: string;

  @Column({ name: 'asset_url', nullable: true })
  assetUrl: string | null;

  /** Category-specific data: e.g. theme -> {primaryColor, backgroundColor}, username_color -> {hex}, frame -> {overlayAssetUrl}. */
  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ name: 'is_animated', default: false })
  isAnimated: boolean;

  /** Most cosmetics are premium-exclusive; a few (default badge/theme/frame = "none") are not, so free users always have a valid selection. */
  @Column({ name: 'requires_premium', default: true })
  requiresPremium: boolean;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;
}
