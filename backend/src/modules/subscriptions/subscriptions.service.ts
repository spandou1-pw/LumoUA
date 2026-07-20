import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { PaymentPlatform } from '../payments/entities/purchase.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
    private readonly events: EventEmitter2,
  ) {}

  /** doc: called by PurchaseVerificationService after a verified subscription purchase/renewal. */
  async activateOrRenew(params: {
    userId: string;
    planId: string;
    platform: PaymentPlatform;
    platformSubscriptionId: string;
    currentPeriodEnd: Date;
  }): Promise<Subscription> {
    let sub = await this.subscriptions.findOne({
      where: { platformSubscriptionId: params.platformSubscriptionId },
    });

    if (!sub) {
      sub = this.subscriptions.create({
        userId: params.userId,
        planId: params.planId,
        platform: params.platform,
        platformSubscriptionId: params.platformSubscriptionId,
        status: 'active',
        currentPeriodEnd: params.currentPeriodEnd,
      });
      const saved = await this.subscriptions.save(sub);
      this.events.emit('subscription.activated', { subscription: saved });
      return saved;
    }

    sub.status = 'active';
    sub.currentPeriodEnd = params.currentPeriodEnd;
    sub.cancelAtPeriodEnd = false;
    const saved = await this.subscriptions.save(sub);
    this.events.emit('subscription.renewed', { subscription: saved });
    return saved;
  }

  async markCanceledAtPeriodEnd(platformSubscriptionId: string): Promise<void> {
    await this.subscriptions.update({ platformSubscriptionId }, { cancelAtPeriodEnd: true });
  }

  async markExpired(platformSubscriptionId: string): Promise<void> {
    const sub = await this.subscriptions.findOne({ where: { platformSubscriptionId } });
    if (!sub) return;
    sub.status = 'expired';
    await this.subscriptions.save(sub);
    this.events.emit('subscription.expired', { subscription: sub });
  }

  async markGracePeriod(platformSubscriptionId: string): Promise<void> {
    await this.subscriptions.update({ platformSubscriptionId }, { status: 'grace_period' as SubscriptionStatus });
  }

  async getActiveForUser(userId: string): Promise<Subscription | null> {
    return this.subscriptions.findOne({
      where: [
        { userId, status: 'active' },
        { userId, status: 'grace_period' },
      ],
      order: { currentPeriodEnd: 'DESC' },
    });
  }

  async cancelViaStripe(userId: string): Promise<Subscription> {
    const sub = await this.getActiveForUser(userId);
    if (!sub || sub.platform !== 'stripe') {
      throw new NotFoundException('NO_ACTIVE_STRIPE_SUBSCRIPTION');
    }
    // Actual Stripe API cancellation call happens in PaymentsController/Service
    // (needs StripeProvider) — this method just reflects the resulting state
    // once that call succeeds, keeping this service platform-agnostic.
    sub.cancelAtPeriodEnd = true;
    return this.subscriptions.save(sub);
  }
}
