import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type BillingInterval = 'monthly' | 'yearly';

@Entity('premium_plans')
export class PremiumPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'price_usd_cents', type: 'int' })
  priceUsdCents: number;

  @Column({ name: 'billing_interval', type: 'varchar' })
  billingInterval: BillingInterval;

  @Column({ name: 'apple_product_id', nullable: true })
  appleProductId: string | null;

  @Column({ name: 'google_product_id', nullable: true })
  googleProductId: string | null;

  @Column({ name: 'stripe_price_id', nullable: true })
  stripePriceId: string | null;

  /** Perks encoded as a flag list so new perks don't require a schema migration. */
  @Column({ type: 'jsonb', default: [] })
  perks: string[];

  @Column({ default: true })
  active: boolean;
}
