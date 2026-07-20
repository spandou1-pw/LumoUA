import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type PaymentPlatform = 'apple' | 'google' | 'stripe';
export type ProductType = 'coins' | 'subscription';
export type PurchaseStatus = 'pending' | 'verified' | 'failed' | 'refunded' | 'disputed';

/**
 * `platformTransactionId` carries a UNIQUE constraint at the DB level
 * (migration) — this is the actual replay-protection mechanism (doc
 * PAYMENTS.md Fraud Protection): a receipt/transaction can be submitted for
 * verification any number of times (client retries, webhook redelivery)
 * and will only ever be credited once, enforced by the database, not just
 * application logic that could have a race condition.
 */
@Entity('purchases')
@Index(['userId', 'createdAt'])
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  platform: PaymentPlatform;

  @Column({ name: 'product_type', type: 'varchar' })
  productType: ProductType;

  /** FK to coin_packs.id or premium_plans.id depending on product_type. */
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Index({ unique: true })
  @Column({ name: 'platform_transaction_id' })
  platformTransactionId: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: PurchaseStatus;

  @Column({ name: 'amount_usd_cents', type: 'int' })
  amountUsdCents: number;

  /** Raw receipt/JWS/webhook payload — retained for dispute evidence, never logged (doc 31 pattern applied to payments). */
  @Column({ name: 'raw_receipt', type: 'text', nullable: true })
  rawReceipt: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
