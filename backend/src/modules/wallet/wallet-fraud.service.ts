import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinTransfer } from './entities/coin-transfer.entity';

const MAX_TRANSFERS_PER_HOUR = 15;
const VELOCITY_WINDOW_SECONDS = 3600;
/** doc COINS.md: many transfers to distinct new recipients in a short window resembles
 * "structuring" (splitting value across many small transfers to avoid scrutiny) even in a
 * closed-loop currency — not itself illegal here, but worth flagging for review rather than
 * ignoring, since it's also the same shape as coordinated abuse (bonus farming, bot rings). */
const STRUCTURING_DISTINCT_RECIPIENTS_THRESHOLD = 8;
const STRUCTURING_WINDOW_HOURS = 24;

@Injectable()
export class WalletFraudService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(CoinTransfer) private readonly transfers: Repository<CoinTransfer>,
  ) {}

  async assertTransferVelocityOk(userId: string): Promise<void> {
    const key = `fraud:transfer-velocity:${userId}`;
    const count = ((await this.cache.get<number>(key)) ?? 0) + 1;
    await this.cache.set(key, count, VELOCITY_WINDOW_SECONDS * 1000);
    if (count > MAX_TRANSFERS_PER_HOUR) {
      throw new HttpException('TRANSFER_VELOCITY_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /**
   * Called after a transfer completes — never blocks the transfer itself
   * (doc: false positives auto-blocking real users is a worse failure mode
   * than a delayed manual review, same philosophy as doc PAYMENTS.md's
   * FraudService). Returns whether this transfer should be auto-flagged.
   */
  async checkStructuringPattern(senderId: string): Promise<{ suspicious: boolean; distinctRecipients: number }> {
    const since = new Date(Date.now() - STRUCTURING_WINDOW_HOURS * 60 * 60 * 1000);
    const result = await this.transfers
      .createQueryBuilder('t')
      .select('COUNT(DISTINCT t.recipient_id)', 'count')
      .where('t.sender_id = :senderId', { senderId })
      .andWhere('t.created_at > :since', { since })
      .getRawOne<{ count: string }>();

    const distinctRecipients = Number(result?.count ?? 0);
    return {
      suspicious: distinctRecipients >= STRUCTURING_DISTINCT_RECIPIENTS_THRESHOLD,
      distinctRecipients,
    };
  }

  async listFlaggedTransfers(limit = 50): Promise<CoinTransfer[]> {
    return this.transfers.find({ where: { status: 'flagged' }, order: { createdAt: 'DESC' }, take: limit });
  }
}
