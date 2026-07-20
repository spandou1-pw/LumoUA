import { Column, Entity, PrimaryColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

/**
 * The `coinBalance` here is a materialized cache of
 * SUM(wallet_transactions.amount) for fast reads — the ledger
 * (WalletTransaction) is the actual source of truth. Both are only ever
 * written together inside a single DB transaction (WalletService), never
 * independently, so they can't drift.
 *
 * `@VersionColumn` gives us optimistic locking on balance updates —
 * concurrent spend attempts (e.g. two gift sends racing) fail one of them
 * with a conflict rather than silently corrupting the balance.
 */
@Entity('wallets')
export class Wallet {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'coin_balance', type: 'bigint', default: 0 })
  coinBalance: string; // bigint surfaces as string in JS — never floats for money/coins

  @VersionColumn({ name: 'version' })
  version: number;

  /** doc COINS.md "Wallet Security" — an admin or the automated fraud system
   * can freeze a wallet pending review. A locked wallet rejects spend/transfer
   * operations but purchases already in flight are not silently swallowed —
   * WalletService checks this explicitly and throws a clear error. */
  @Column({ default: false })
  locked: boolean;

  @Column({ name: 'locked_reason', type: 'text', nullable: true })
  lockedReason: string | null;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
