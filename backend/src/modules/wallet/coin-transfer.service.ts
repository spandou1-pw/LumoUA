import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { CoinTransfer } from './entities/coin-transfer.entity';
import { WalletService } from './wallet.service';
import { WalletSecurityService } from './wallet-security.service';
import { WalletFraudService } from './wallet-fraud.service';
import { PolicyService } from '../users/policy.service';
import { PremiumLimitsService } from '../premium/premium-limits.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.dto';

const DAILY_LIMIT_CACHE_TTL_SECONDS = 24 * 60 * 60;

/**
 * doc COINS.md: closed-loop, non-redeemable peer-to-peer transfer. Every
 * check here (blocked-relationship, lock, daily cap, velocity) runs
 * server-side before a single coin moves — none of it is trusted from the
 * client. This mirrors GiftsService's send() structure deliberately (same
 * shape of problem: move value between two users safely), but transfers
 * are a strictly larger risk surface (recipient gets *spendable* coins,
 * not a notional record), hence the extra daily-cap + fraud layer gift
 * sending doesn't need.
 */
@Injectable()
export class CoinTransferService {
  constructor(
    @InjectRepository(CoinTransfer) private readonly transfers: Repository<CoinTransfer>,
    private readonly wallet: WalletService,
    private readonly security: WalletSecurityService,
    private readonly fraud: WalletFraudService,
    private readonly policy: PolicyService,
    private readonly limits: PremiumLimitsService,
    private readonly notifications: NotificationsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async transfer(senderId: string, recipientId: string, amount: bigint, message?: string): Promise<CoinTransfer> {
    if (senderId === recipientId) throw new ForbiddenException('CANNOT_TRANSFER_TO_SELF');
    if (await this.policy.isBlockedEitherWay(senderId, recipientId)) {
      throw new ForbiddenException('BLOCKED');
    }

    await this.security.assertNotLocked(senderId);
    await this.security.assertNotLocked(recipientId); // don't credit a wallet under fraud review either

    await this.assertDailyLimitOk(senderId, amount);
    await this.fraud.assertTransferVelocityOk(senderId);

    const referenceId = uuid();
    await this.wallet.transferBetweenWallets({ senderId, recipientId, amount, referenceId, message });

    const record = await this.transfers.save(
      this.transfers.create({
        id: referenceId,
        senderId,
        recipientId,
        amount: amount.toString(),
        message: message ?? null,
        status: 'completed',
      }),
    );

    // doc: fraud check runs AFTER the transfer completes and only flags for
    // review — never blocks a transfer that already passed the hard checks
    // above (velocity, lock, daily cap). Flagging surfaces the transfer to
    // admins without punishing the user pre-emptively on a heuristic.
    const structuring = await this.fraud.checkStructuringPattern(senderId);
    if (structuring.suspicious) {
      record.status = 'flagged';
      record.flaggedReason = `${structuring.distinctRecipients} distinct recipients in 24h`;
      await this.transfers.save(record);
    }

    await this.notifications.notify(
      recipientId,
      'new_like', // doc 25: same placeholder-type note as Stage 8 gifts — a dedicated
      // 'coins_received' type is a one-line addition to doc 25's enum when this ships for real
      { transferId: record.id, senderId, amount: amount.toString() },
      'Отримано монети',
      'Вам надіслали монети',
    );

    return record;
  }

  /** doc PREMIUM.md cross-reference: daily transfer cap differs by tier, tracked via a rolling Redis counter keyed per calendar day. */
  private async assertDailyLimitOk(senderId: string, amount: bigint): Promise<void> {
    const dayKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `wallet:daily-transfer:${senderId}:${dayKey}`;
    const spentToday = BigInt((await this.cache.get<string>(cacheKey)) ?? '0');
    const limits = await this.limits.limitsFor(senderId);
    const newTotal = spentToday + amount;

    if (newTotal > BigInt(limits.dailyCoinTransferLimit)) {
      throw new ForbiddenException('DAILY_TRANSFER_LIMIT_EXCEEDED');
    }
    await this.cache.set(cacheKey, newTotal.toString(), DAILY_LIMIT_CACHE_TTL_SECONDS * 1000);
  }

  async sentHistory(userId: string, cursor?: string, limit = 30): Promise<PaginatedResult<CoinTransfer>> {
    const qb = this.transfers
      .createQueryBuilder('t')
      .where('t.sender_id = :userId', { userId })
      .orderBy('t.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('t.created_at < :cursor', { cursor: new Date(cursor) });
    return paginate(await qb.getMany(), limit);
  }

  async receivedHistory(userId: string, cursor?: string, limit = 30): Promise<PaginatedResult<CoinTransfer>> {
    const qb = this.transfers
      .createQueryBuilder('t')
      .where('t.recipient_id = :userId', { userId })
      .orderBy('t.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('t.created_at < :cursor', { cursor: new Date(cursor) });
    return paginate(await qb.getMany(), limit);
  }
}
