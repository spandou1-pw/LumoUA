import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type GiftRarity = 'common' | 'rare' | 'legendary';

/**
 * doc GIFTS.md: rarity/limited/seasonal are catalog *attributes*, purchased
 * deterministically at a fixed, known coin price — never randomized
 * ("pull a random rare gift" is explicitly not built; that would be
 * loot-box-adjacent mechanics, a distinct legal/product decision, doc
 * PAYMENTS.md's fraud/regulation reasoning applies here too).
 */
@Entity('gift_catalog_items')
@Index(['categoryId'])
export class GiftCatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column()
  name: string;

  @Column({ name: 'coin_cost', type: 'bigint' })
  coinCost: string;

  @Column({ name: 'icon_url' })
  iconUrl: string;

  /** For animated gifts — a Lottie/video asset played on send (doc: "Animated Gifts"). */
  @Column({ name: 'animation_url', nullable: true })
  animationUrl: string | null;

  @Column({ name: 'is_animated', default: false })
  isAnimated: boolean;

  @Column({ type: 'varchar', default: 'common' })
  rarity: GiftRarity;

  /** doc: "Limited Gifts" — a fixed, known-in-advance stock, decremented on each send.
   * NULL = unlimited (the common case for everyday gifts). */
  @Column({ name: 'total_supply', type: 'bigint', nullable: true })
  totalSupply: string | null;

  @Column({ name: 'remaining_supply', type: 'bigint', nullable: true })
  remainingSupply: string | null;

  /** doc: "Seasonal Gifts" — a tag (e.g. 'new-year-2027') plus a visibility window; the
   * tag lets analytics group seasonal performance without needing a separate Season table. */
  @Column({ name: 'season_tag', nullable: true })
  seasonTag: string | null;

  @Column({ name: 'available_from', type: 'timestamptz', nullable: true })
  availableFrom: Date | null;

  @Column({ name: 'available_until', type: 'timestamptz', nullable: true })
  availableUntil: Date | null;

  @Column({ default: true })
  active: boolean;
}

