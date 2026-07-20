import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * doc GIFTS.md: same pattern as Wallet (Stage 6) — GiftTransaction is the
 * append-only source of truth ("who sent what to whom, when"); this table
 * is a materialized per-(user, item) count, updated only alongside a
 * GiftTransaction insert inside the same DB transaction, never
 * independently, so it can't drift.
 */
@Entity('user_gift_inventory')
export class UserGiftInventory {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'gift_catalog_item_id', type: 'uuid' })
  giftCatalogItemId: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ name: 'first_received_at', type: 'timestamptz' })
  firstReceivedAt: Date;

  @UpdateDateColumn({ name: 'last_received_at', type: 'timestamptz' })
  lastReceivedAt: Date;
}
