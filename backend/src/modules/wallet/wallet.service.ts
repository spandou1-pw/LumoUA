import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction, WalletTransactionType } from './entities/wallet-transaction.entity';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.dto';

export interface LedgerMutation {
  userId: string;
  amount: bigint; // positive = credit, negative = debit
  type: WalletTransactionType;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

const MAX_RETRIES = 3; // optimistic-lock retry for concurrent spend races

@Injectable()
export class WalletService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    return this.dataSource.transaction(async (manager) => {
      let wallet = await manager.findOne(Wallet, { where: { userId } });
      if (!wallet) {
        wallet = manager.create(Wallet, { userId, coinBalance: '0' });
        wallet = await manager.save(wallet);
      }
      return wallet;
    });
  }

  async getBalance(userId: string): Promise<bigint> {
    const wallet = await this.getOrCreateWallet(userId);
    return BigInt(wallet.coinBalance);
  }

  /**
   * The one place any coin balance ever changes. Credits and debits are the
   * same operation (sign of `amount`) so there's exactly one code path to
   * get right, not two that can drift apart. Debits below zero are rejected
   * — no negative balances, ever, regardless of caller.
   *
   * Optimistic-locking retry loop: doc PAYMENTS.md — two concurrent spends
   * (e.g. sending two gifts back-to-back) racing on the same wallet row
   * fail the loser's version check; retried against the fresh balance
   * rather than silently overwriting.
   */
  async applyLedgerMutation(mutation: LedgerMutation): Promise<WalletTransaction> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          let wallet = await manager.findOne(Wallet, { where: { userId: mutation.userId } });
          if (!wallet) {
            wallet = await manager.save(manager.create(Wallet, { userId: mutation.userId, coinBalance: '0' }));
          }

          const currentBalance = BigInt(wallet.coinBalance);
          const newBalance = currentBalance + mutation.amount;
          if (newBalance < 0n) {
            throw new BadRequestException('INSUFFICIENT_COIN_BALANCE');
          }

          wallet.coinBalance = newBalance.toString();
          await manager.save(wallet); // VersionColumn enforces optimistic lock here

          const entry = manager.create(WalletTransaction, {
            userId: mutation.userId,
            type: mutation.type,
            amount: mutation.amount.toString(),
            balanceAfter: newBalance.toString(),
            referenceType: mutation.referenceType ?? null,
            referenceId: mutation.referenceId ?? null,
            metadata: mutation.metadata ?? null,
          });
          return manager.save(entry);
        });
      } catch (err) {
        const isOptimisticLockFailure = (err as Error).name === 'OptimisticLockVersionMismatchError';
        if (isOptimisticLockFailure && attempt < MAX_RETRIES - 1) continue;
        throw err instanceof ConflictException || err instanceof BadRequestException
          ? err
          : new ConflictException('WALLET_UPDATE_CONFLICT');
      }
    }
    throw new ConflictException('WALLET_UPDATE_CONFLICT');
  }

  async credit(mutation: Omit<LedgerMutation, 'amount'> & { amount: bigint }): Promise<WalletTransaction> {
    if (mutation.amount <= 0n) throw new BadRequestException('CREDIT_AMOUNT_MUST_BE_POSITIVE');
    return this.applyLedgerMutation(mutation);
  }

  async debit(mutation: Omit<LedgerMutation, 'amount'> & { amount: bigint }): Promise<WalletTransaction> {
    if (mutation.amount <= 0n) throw new BadRequestException('DEBIT_AMOUNT_MUST_BE_POSITIVE');
    return this.applyLedgerMutation({ ...mutation, amount: -mutation.amount });
  }

  /**
   * doc COINS.md "Coins Transfers": debit sender + credit recipient inside
   * ONE database transaction — unlike a gift (which calls `debit` once,
   * Stage 8), a transfer moves real spendable value to another wallet, so
   * both sides must commit together or not at all. Two separate
   * `applyLedgerMutation` calls would risk a sender debited with no
   * matching recipient credit if the process crashed between them.
   */
  async transferBetweenWallets(params: {
    senderId: string;
    recipientId: string;
    amount: bigint;
    referenceId: string; // CoinTransfer.id, set by the caller before calling this
    message?: string;
  }): Promise<{ senderEntry: WalletTransaction; recipientEntry: WalletTransaction }> {
    if (params.amount <= 0n) throw new BadRequestException('TRANSFER_AMOUNT_MUST_BE_POSITIVE');

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          let sender = await manager.findOne(Wallet, { where: { userId: params.senderId } });
          if (!sender) sender = await manager.save(manager.create(Wallet, { userId: params.senderId, coinBalance: '0' }));

          const senderBalance = BigInt(sender.coinBalance);
          const senderNewBalance = senderBalance - params.amount;
          if (senderNewBalance < 0n) throw new BadRequestException('INSUFFICIENT_COIN_BALANCE');

          let recipient = await manager.findOne(Wallet, { where: { userId: params.recipientId } });
          if (!recipient) recipient = await manager.save(manager.create(Wallet, { userId: params.recipientId, coinBalance: '0' }));
          const recipientNewBalance = BigInt(recipient.coinBalance) + params.amount;

          sender.coinBalance = senderNewBalance.toString();
          recipient.coinBalance = recipientNewBalance.toString();
          await manager.save(sender); // VersionColumn optimistic lock on both rows
          await manager.save(recipient);

          const senderEntry = await manager.save(
            manager.create(WalletTransaction, {
              userId: params.senderId,
              type: 'transfer_sent',
              amount: (-params.amount).toString(),
              balanceAfter: senderNewBalance.toString(),
              referenceType: 'coin_transfer',
              referenceId: params.referenceId,
              metadata: { recipientId: params.recipientId, message: params.message },
            }),
          );
          const recipientEntry = await manager.save(
            manager.create(WalletTransaction, {
              userId: params.recipientId,
              type: 'transfer_received',
              amount: params.amount.toString(),
              balanceAfter: recipientNewBalance.toString(),
              referenceType: 'coin_transfer',
              referenceId: params.referenceId,
              metadata: { senderId: params.senderId, message: params.message },
            }),
          );

          return { senderEntry, recipientEntry };
        });
      } catch (err) {
        const isOptimisticLockFailure = (err as Error).name === 'OptimisticLockVersionMismatchError';
        if (isOptimisticLockFailure && attempt < MAX_RETRIES - 1) continue;
        throw err instanceof ConflictException || err instanceof BadRequestException
          ? err
          : new ConflictException('WALLET_UPDATE_CONFLICT');
      }
    }
    throw new ConflictException('WALLET_UPDATE_CONFLICT');
  }

  async listTransactions(
    userId: string,
    cursor?: string,
    limit = 30,
  ): Promise<PaginatedResult<WalletTransaction>> {
    const qb = this.dataSource
      .getRepository(WalletTransaction)
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId })
      .orderBy('t.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('t.created_at < :cursor', { cursor: new Date(cursor) });
    const rows = await qb.getMany();
    return paginate(rows, limit);
  }
}
