import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';

export interface RevenueByDay {
  date: string;
  revenueUsdCents: number;
  purchaseCount: number;
}

@Injectable()
export class PaymentAnalyticsService {
  constructor(
    @InjectRepository(Purchase) private readonly purchases: Repository<Purchase>,
    @InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async revenueByDay(sinceDays = 30): Promise<RevenueByDay[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.purchases
      .createQueryBuilder('p')
      .select("to_char(p.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(p.amount_usd_cents)', 'revenueUsdCents')
      .addSelect('COUNT(*)', 'purchaseCount')
      .where('p.status = :status', { status: 'verified' })
      .andWhere('p.created_at > :since', { since })
      .groupBy("to_char(p.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; revenueUsdCents: string; purchaseCount: string }>();

    return rows.map((r) => ({
      date: r.date,
      revenueUsdCents: Number(r.revenueUsdCents),
      purchaseCount: Number(r.purchaseCount),
    }));
  }

  async topCoinPacks(limit = 10): Promise<{ productId: string; purchaseCount: number; revenueUsdCents: number }[]> {
    const rows = await this.purchases
      .createQueryBuilder('p')
      .select('p.product_id', 'productId')
      .addSelect('COUNT(*)', 'purchaseCount')
      .addSelect('SUM(p.amount_usd_cents)', 'revenueUsdCents')
      .where('p.product_type = :type', { type: 'coins' })
      .andWhere('p.status = :status', { status: 'verified' })
      .groupBy('p.product_id')
      .orderBy('"revenueUsdCents"', 'DESC')
      .limit(limit)
      .getRawMany<{ productId: string; purchaseCount: string; revenueUsdCents: string }>();

    return rows.map((r) => ({
      productId: r.productId,
      purchaseCount: Number(r.purchaseCount),
      revenueUsdCents: Number(r.revenueUsdCents),
    }));
  }

  /** Rough MRR estimate — monthly-normalized active-subscription value. Not a GAAP-accurate figure. */
  async activeSubscriptionCounts(): Promise<{ platform: string; count: number }[]> {
    const rows = await this.subscriptions
      .createQueryBuilder('s')
      .select('s.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .where('s.status IN (:...statuses)', { statuses: ['active', 'grace_period'] })
      .groupBy('s.platform')
      .getRawMany<{ platform: string; count: string }>();

    return rows.map((r) => ({ platform: r.platform, count: Number(r.count) }));
  }

  async refundRate(sinceDays = 30): Promise<{ totalPurchases: number; refundedPurchases: number; refundRate: number }> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const [totalSince, refunded] = await Promise.all([
      this.purchases.createQueryBuilder('p').where('p.created_at > :since', { since }).getCount(),
      this.purchases
        .createQueryBuilder('p')
        .where('p.status = :status', { status: 'refunded' })
        .andWhere('p.created_at > :since', { since })
        .getCount(),
    ]);
    return {
      totalPurchases: totalSince,
      refundedPurchases: refunded,
      refundRate: totalSince > 0 ? refunded / totalSince : 0,
    };
  }

  /**
   * doc GROWTH.md "Premium Conversion Analytics": total users vs. users who
   * have ever subscribed vs. currently-active subscribers — a real
   * three-stage funnel reusing this existing analytics service rather than
   * a parallel one (doc 40 consistency rule).
   */
  async premiumConversionFunnel(): Promise<{
    totalUsers: number;
    everSubscribed: number;
    currentlyActive: number;
    conversionRate: number;
  }> {
    const [totalUsers, everSubscribed, currentlyActive] = await Promise.all([
      this.users.count(),
      this.subscriptions
        .createQueryBuilder('s')
        .select('COUNT(DISTINCT s.user_id)', 'count')
        .getRawOne<{ count: string }>()
        .then((r) => Number(r?.count ?? 0)),
      this.subscriptions.count({ where: [{ status: 'active' }, { status: 'grace_period' }] }),
    ]);

    return {
      totalUsers,
      everSubscribed,
      currentlyActive,
      conversionRate: totalUsers > 0 ? everSubscribed / totalUsers : 0,
    };
  }
}
