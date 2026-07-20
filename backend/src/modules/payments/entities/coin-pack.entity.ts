import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('coin_packs')
export class CoinPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'coin_amount', type: 'bigint' })
  coinAmount: string;

  @Column({ name: 'price_usd_cents', type: 'int' })
  priceUsdCents: number;

  /** Product identifiers registered in each store's own console — the price shown to the
   * user on iOS/Android is whatever Apple/Google configured for that product ID, which may
   * differ slightly from `priceUsdCents` after regional pricing/taxes — this field is the
   * canonical USD reference price for analytics, not the authoritative charged price. */
  @Column({ name: 'apple_product_id', nullable: true })
  appleProductId: string | null;

  @Column({ name: 'google_product_id', nullable: true })
  googleProductId: string | null;

  @Column({ name: 'stripe_price_id', nullable: true })
  stripePriceId: string | null;

  @Column({ default: true })
  active: boolean;
}
