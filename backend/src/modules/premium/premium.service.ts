import { ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/**
 * doc PREMIUM.md: every other premium-related service (cosmetics, limits,
 * reactions) calls `isPremium()` here rather than each independently
 * querying SubscriptionsService — one code path, so "what counts as
 * premium" can never drift between features (e.g. accidentally treating
 * grace_period as non-premium in one place and premium in another).
 */
@Injectable()
export class PremiumService {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  async isPremium(userId: string): Promise<boolean> {
    const sub = await this.subscriptions.getActiveForUser(userId);
    return sub !== null; // getActiveForUser already includes 'active' | 'grace_period'
  }

  async requirePremiumOrThrow(userId: string): Promise<void> {
    if (!(await this.isPremium(userId))) {
      throw new ForbiddenException('PREMIUM_SUBSCRIPTION_REQUIRED');
    }
  }
}
