import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type TransferStatus = 'completed' | 'reversed' | 'flagged';

/**
 * doc COINS.md: closed-loop, non-redeemable transfer — coins move from one
 * user's spendable balance to another's, but never leave the platform as
 * cash. A dedicated table (rather than only two WalletTransaction rows)
 * makes transfers independently queryable for fraud review and analytics
 * without joining/pairing ledger rows.
 */
@Entity('coin_transfers')
@Index(['senderId', 'createdAt'])
@Index(['recipientId', 'createdAt'])
export class CoinTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ type: 'bigint' })
  amount: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', default: 'completed' })
  status: TransferStatus;

  @Column({ name: 'flagged_reason', type: 'text', nullable: true })
  flaggedReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
