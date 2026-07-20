import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinTransfer } from './entities/coin-transfer.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';

@Injectable()
export class WalletAnalyticsService {
  constructor(
    @InjectRepository(CoinTransfer) private readonly transfers: Repository<CoinTransfer>,
    @InjectRepository(WalletTransaction) private readonly walletTransactions: Repository<WalletTransaction>,
  ) {}

  async transferVolumeByDay(sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.transfers
      .createQueryBuilder('t')
      .select("to_char(t.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'transferCount')
      .addSelect('SUM(t.amount)', 'totalCoinsTransferred')
      .where('t.created_at > :since', { since })
      .andWhere("t.status != 'reversed'")
      .groupBy("to_char(t.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; transferCount: string; totalCoinsTransferred: string }>();

    return rows.map((r) => ({
      date: r.date,
      transferCount: Number(r.transferCount),
      totalCoinsTransferred: Number(r.totalCoinsTransferred),
    }));
  }

  async topSenders(sinceDays = 30, limit = 10) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.transfers
      .createQueryBuilder('t')
      .select('t.sender_id', 'senderId')
      .addSelect('COUNT(*)', 'transferCount')
      .addSelect('SUM(t.amount)', 'totalSent')
      .where('t.created_at > :since', { since })
      .groupBy('t.sender_id')
      .orderBy('"totalSent"', 'DESC')
      .limit(limit)
      .getRawMany<{ senderId: string; transferCount: string; totalSent: string }>();

    return rows.map((r) => ({
      senderId: r.senderId,
      transferCount: Number(r.transferCount),
      totalSent: Number(r.totalSent),
    }));
  }

  async flaggedTransferCount(sinceDays = 30): Promise<number> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    return this.transfers
      .createQueryBuilder('t')
      .where("t.status = 'flagged'")
      .andWhere('t.created_at > :since', { since })
      .getCount();
  }

  /** Ledger-wide breakdown by transaction type — a sanity-check view distinct from purchase revenue (Stage 6 PaymentAnalyticsService). */
  async ledgerBreakdown(sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.walletTransactions
      .createQueryBuilder('w')
      .select('w.type', 'type')
      .addSelect('COUNT(*)', 'entryCount')
      .addSelect('SUM(ABS(w.amount::numeric))', 'totalVolume')
      .where('w.created_at > :since', { since })
      .groupBy('w.type')
      .getRawMany<{ type: string; entryCount: string; totalVolume: string }>();

    return rows.map((r) => ({ type: r.type, entryCount: Number(r.entryCount), totalVolume: Number(r.totalVolume) }));
  }
}
