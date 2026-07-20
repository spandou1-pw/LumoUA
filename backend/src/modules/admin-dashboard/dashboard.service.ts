import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { PaymentAnalyticsService } from '../payments/payment-analytics.service';
import { WalletAnalyticsService } from '../wallet/wallet-analytics.service';
import { GiftAnalyticsService } from '../gifts/gift-analytics.service';
import { ReportsService } from '../moderation/reports.service';

/**
 * doc ADMIN.md "Dashboard": composes existing per-domain analytics
 * services (built across Stages 6-9) into one overview call — this
 * service owns no analytics logic of its own, only the aggregation. Same
 * pattern as doc PROFILE.md's ProfileCustomizationService (Stage 10):
 * a pure read-composition layer, no duplicated business rules.
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    private readonly paymentAnalytics: PaymentAnalyticsService,
    private readonly walletAnalytics: WalletAnalyticsService,
    private readonly giftAnalytics: GiftAnalyticsService,
    private readonly reportsService: ReportsService,
  ) {}

  async overview() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast7Days,
      totalPosts,
      revenueByDay,
      activeSubscriptions,
      refundRate,
      transferVolume,
      topGifts,
      openReportsCount,
    ] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { createdAt: MoreThan(sevenDaysAgo) } }),
      this.posts.count(),
      this.paymentAnalytics.revenueByDay(7),
      this.paymentAnalytics.activeSubscriptionCounts(),
      this.paymentAnalytics.refundRate(30),
      this.walletAnalytics.transferVolumeByDay(7),
      this.giftAnalytics.topGiftsSent(7, 5),
      this.reportsService.countOpen(),
    ]);

    const revenueLast7DaysUsdCents = revenueByDay.reduce((sum, d) => sum + d.revenueUsdCents, 0);

    return {
      users: { total: totalUsers, newLast7Days: newUsersLast7Days },
      content: { totalPosts },
      revenue: { last7DaysUsdCents: revenueLast7DaysUsdCents, byDay: revenueByDay, refundRate },
      premium: { activeSubscriptionsByPlatform: activeSubscriptions },
      wallet: { transferVolumeLast7Days: transferVolume },
      gifts: { topGiftsLast7Days: topGifts },
      moderation: { openReports: openReportsCount },
    };
  }
}
