import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type AssetPackType = 'emoji' | 'sticker';

/**
 * doc PREMIUM.md: unlike badges/frames/themes (pick exactly one), emoji and
 * sticker packs are "have access to use any item in this pack" — access is
 * derived live from subscription status (doc 6's SubscriptionsService), not
 * stored as a separate per-user unlock row, since Phase 1 ties all premium
 * access uniformly to "currently has an active subscription" rather than
 * a per-pack purchase/grant model (that's a plausible future extension,
 * not built speculatively now).
 */
@Entity('premium_asset_packs')
export class PremiumAssetPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: AssetPackType;

  @Column()
  name: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string | null;

  /** Array of {id, name, assetUrl, isAnimated} — kept denormalized in the pack row since
   * packs are small (dozens of items) and always fetched as a whole unit, never queried
   * per-item — a separate items table would add a join for no real benefit at this scale. */
  @Column({ type: 'jsonb', default: [] })
  items: Array<{ id: string; name: string; assetUrl: string; isAnimated: boolean }>;

  @Column({ default: true })
  active: boolean;
}
