import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type WalletTransactionType =
  | 'coin_purchase' // real-money purchase credited coins
  | 'gift_sent' // coins debited to send a gift
  | 'gift_received_notional' // notional credit shown to recipient — NOT withdrawable (see doc PAYMENTS.md)
  | 'refund_reversal' // a prior purchase was refunded — coins clawed back
  | 'admin_adjustment' // support/ops correction, always tied to an admin actor + reason
  | 'premium_grant' // coins granted as part of a premium plan perk, if applicable
  | 'transfer_sent' // doc COINS.md: peer-to-peer coin transfer, sender side (real debit)
  | 'transfer_received'; // doc COINS.md: peer-to-peer coin transfer, recipient side (real credit — unlike gift_received_notional)

/**
 * Append-only. Rows are never updated or deleted — a correction is a new
 * offsetting row (`admin_adjustment` or `refund_reversal`), same as
 * standard double-entry bookkeeping practice. This is what makes the
 * ledger auditable and disputes resolvable.
 */
@Entity('wallet_transactions')
@Index(['userId', 'createdAt'])
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  type: WalletTransactionType;

  /** Positive = credit, negative = debit. bigint-as-string, never float. */
  @Column({ type: 'bigint' })
  amount: string;

  /** Wallet.coinBalance immediately after this entry applied — cheap audit trail. */
  @Column({ name: 'balance_after', type: 'bigint' })
  balanceAfter: string;

  /** e.g. { type: 'purchase', id: purchaseId } or { type: 'gift', id: giftTransactionId }. */
  @Column({ name: 'reference_type', nullable: true })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
