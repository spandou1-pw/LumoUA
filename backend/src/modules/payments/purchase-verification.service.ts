import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Purchase, PaymentPlatform, ProductType } from './entities/purchase.entity';
import { CoinPack } from './entities/coin-pack.entity';
import { PremiumPlan } from './entities/premium-plan.entity';
import { WalletService } from '../wallet/wallet.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FraudService } from './fraud.service';

export interface FulfilPurchaseInput {
  userId: string;
  platform: PaymentPlatform;
  productType: ProductType;
  productId: string; // CoinPack.id or PremiumPlan.id
  platformTransactionId: string; // Apple transactionId / Google purchaseToken / Stripe payment_intent or subscription id
  amountUsdCents: number;
  rawReceipt?: string;
  subscriptionPeriodEnd?: Date; // required if productType === 'subscription'
}

/**
 * The single fulfillment path every platform (Apple/Google/Stripe) and
 * every entry point (client-initiated verification call, webhook) routes
 * through. This is deliberate: coin-crediting and subscription-activation
 * logic exists in exactly one place, not duplicated per-platform, which is
 * where financial bugs (double-credit, missed credit) tend to come from.
 */
@Injectable()
export class PurchaseVerificationService {
  private readonly logger = new Logger(PurchaseVerificationService.name);

  constructor(
    @InjectRepository(Purchase) private readonly purchases: Repository<Purchase>,
    @InjectRepository(CoinPack) private readonly coinPacks: Repository<CoinPack>,
    @InjectRepository(PremiumPlan) private readonly premiumPlans: Repository<PremiumPlan>,
    private readonly wallet: WalletService,
    private readonly subscriptions: SubscriptionsService,
    private readonly fraud: FraudService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * doc Fraud Protection / idempotency: `platformTransactionId` has a
   * UNIQUE DB constraint. Inserting a duplicate throws a Postgres unique
   * violation, caught here and treated as "already fulfilled" — returns
   * the existing record rather than crediting twice. This is the actual
   * replay-safety mechanism, not just an application-level `if (exists)`
   * check that a race condition could slip past.
   */
  async fulfil(input: FulfilPurchaseInput): Promise<Purchase> {
    await this.fraud.assertNotRateLimited(input.userId);

    let purchase: Purchase;
    try {
      purchase = await this.purchases.save(
        this.purchases.create({
          userId: input.userId,
          platform: input.platform,
          productType: input.productType,
          productId: input.productId,
          platformTransactionId: input.platformTransactionId,
          amountUsdCents: input.amountUsdCents,
          rawReceipt: input.rawReceipt ?? null,
          status: 'pending',
        }),
      );
    } catch (err) {
      const isDuplicate = (err as { code?: string }).code === '23505'; // Postgres unique_violation
      if (isDuplicate) {
        const existing = await this.purchases.findOne({
          where: { platformTransactionId: input.platformTransactionId },
        });
        if (existing) {
          this.logger.log(`Duplicate fulfillment attempt for ${input.platformTransactionId} — no-op`);
          return existing;
        }
      }
      throw err;
    }

    if (input.productType === 'coins') {
      await this.fulfilCoins(purchase, input);
    } else {
      await this.fulfilSubscription(purchase, input);
    }

    purchase.status = 'verified';
    const saved = await this.purchases.save(purchase);
    this.events.emit('purchase.verified', { purchase: saved });
    return saved;
  }

  private async fulfilCoins(purchase: Purchase, input: FulfilPurchaseInput): Promise<void> {
    const pack = await this.coinPacks.findOne({ where: { id: input.productId } });
    if (!pack) throw new NotFoundException('COIN_PACK_NOT_FOUND');

    await this.wallet.credit({
      userId: input.userId,
      amount: BigInt(pack.coinAmount),
      type: 'coin_purchase',
      referenceType: 'purchase',
      referenceId: purchase.id,
      metadata: { coinPackId: pack.id, platform: input.platform },
    });
  }

  private async fulfilSubscription(_purchase: Purchase, input: FulfilPurchaseInput): Promise<void> {
    const plan = await this.premiumPlans.findOne({ where: { id: input.productId } });
    if (!plan) throw new NotFoundException('PREMIUM_PLAN_NOT_FOUND');
    if (!input.subscriptionPeriodEnd) {
      throw new ConflictException('SUBSCRIPTION_PERIOD_END_REQUIRED');
    }

    await this.subscriptions.activateOrRenew({
      userId: input.userId,
      planId: plan.id,
      platform: input.platform,
      platformSubscriptionId: input.platformTransactionId,
      currentPeriodEnd: input.subscriptionPeriodEnd,
    });
  }

  async findByPlatformTransactionId(platformTransactionId: string): Promise<Purchase | null> {
    return this.purchases.findOne({ where: { platformTransactionId } });
  }

  async listForUser(userId: string): Promise<Purchase[]> {
    return this.purchases.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
