import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RefundsService } from '../payments/refunds.service';
import { PaymentAnalyticsService } from '../payments/payment-analytics.service';
import { FraudService } from '../payments/fraud.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from '../payments/entities/purchase.entity';

@ApiTags('Admin — Payments')
@ApiBearerAuth()
@Controller('admin/payments')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN) // doc 32: financial actions are admin-only, not moderator (stricter than content moderation)
export class AdminPaymentsController {
  constructor(
    @InjectRepository(Purchase) private readonly purchases: Repository<Purchase>,
    private readonly refunds: RefundsService,
    private readonly analytics: PaymentAnalyticsService,
    private readonly fraud: FraudService,
  ) {}

  @Get('purchases')
  @ApiOperation({ summary: 'Recent purchases across all users/platforms' })
  async listPurchases(@Query('limit') limit = 50) {
    return this.purchases.find({ order: { createdAt: 'DESC' }, take: Number(limit) });
  }

  @Get('purchases/:userId')
  @ApiOperation({ summary: "A specific user's purchase history — support/dispute investigation" })
  async userPurchases(@Param('userId') userId: string) {
    const [purchases, recentCount] = await Promise.all([
      this.purchases.find({ where: { userId }, order: { createdAt: 'DESC' } }),
      this.fraud.recentPurchaseCount(userId),
    ]);
    return { purchases, recentPurchaseCount24h: recentCount };
  }

  @Post('refunds/:purchaseId')
  @ApiOperation({ summary: 'Admin-initiated refund (Stripe purchases only — Apple/Google refunds originate from the user via their store)' })
  async refund(
    @CurrentUser('id') adminId: string,
    @Param('purchaseId') purchaseId: string,
    @Body('reason') reason: string,
  ) {
    return this.refunds.adminRefundStripePurchase(purchaseId, adminId, reason);
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Daily revenue for the trailing N days' })
  async revenue(@Query('days') days = 30) {
    return this.analytics.revenueByDay(Number(days));
  }

  @Get('analytics/top-coin-packs')
  @ApiOperation({ summary: 'Best-selling coin packs by revenue' })
  async topCoinPacks() {
    return this.analytics.topCoinPacks();
  }

  @Get('analytics/subscriptions')
  @ApiOperation({ summary: 'Active subscription counts by platform' })
  async subscriptionCounts() {
    return this.analytics.activeSubscriptionCounts();
  }

  @Get('analytics/refund-rate')
  @ApiOperation({ summary: 'Refund rate over the trailing N days — a key fraud/quality signal' })
  async refundRate(@Query('days') days = 30) {
    return this.analytics.refundRate(Number(days));
  }

  @Get('analytics/premium-conversion')
  @ApiOperation({ summary: 'doc GROWTH.md: total users -> ever subscribed -> currently active funnel' })
  async premiumConversion() {
    return this.analytics.premiumConversionFunnel();
  }
}
