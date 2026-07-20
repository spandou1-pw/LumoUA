import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentPlatform } from '../../payments/entities/purchase.entity';

export type SubscriptionStatus = 'active' | 'grace_period' | 'canceled' | 'expired';

@Entity('subscriptions')
@Index(['userId'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @Column({ type: 'varchar' })
  platform: PaymentPlatform;

  /** Apple originalTransactionId / Google purchaseToken / Stripe subscription id. */
  @Index({ unique: true })
  @Column({ name: 'platform_subscription_id' })
  platformSubscriptionId: string;

  @Column({ type: 'varchar' })
  status: SubscriptionStatus;

  @Column({ name: 'current_period_end', type: 'timestamptz' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
