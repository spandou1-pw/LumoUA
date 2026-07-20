import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type RefundInitiator = 'user' | 'admin' | 'platform_webhook';

@Entity('refund_records')
export class RefundRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId: string;

  @Column({ name: 'refunded_amount_usd_cents', type: 'int' })
  refundedAmountUsdCents: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'initiated_by', type: 'varchar' })
  initiatedBy: RefundInitiator;

  /** Admin user id, if initiatedBy = 'admin' — ties to doc 24 audit trail. */
  @Column({ name: 'admin_actor_id', type: 'uuid', nullable: true })
  adminActorId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
