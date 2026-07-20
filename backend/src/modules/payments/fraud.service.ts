import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './entities/purchase.entity';

const MAX_PURCHASES_PER_HOUR = 20; // generous ceiling — catches automation/abuse, not real users
const VELOCITY_WINDOW_SECONDS = 3600;

/**
 * doc PAYMENTS.md Fraud Protection: layered, not a single mechanism.
 * 1. Replay protection: unique platformTransactionId constraint (see
 *    PurchaseVerificationService) — the strongest layer, DB-enforced.
 * 2. Velocity limiting: this service, Redis-backed counter.
 * 3. Platform-native fraud signals: Stripe Radar runs automatically on
 *    every Stripe Checkout session (no code needed beyond using Checkout
 *    rather than raw PaymentIntents, which we already do). Apple/Google
 *    have their own fraud detection on their side of the transaction —
 *    Lumo receives already-vetted purchases from them.
 * 4. Anomaly flag for manual review: `flagForReview` below — a cheap
 *    heuristic (many failed verification attempts) that queues a purchase
 *    for admin look-in rather than auto-blocking, since false positives on
 *    auto-blocking real purchases are a worse failure mode than a delayed
 *    manual review.
 */
@Injectable()
export class FraudService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(Purchase) private readonly purchases: Repository<Purchase>,
  ) {}

  async assertNotRateLimited(userId: string): Promise<void> {
    const key = `fraud:purchase-velocity:${userId}`;
    const count = ((await this.cache.get<number>(key)) ?? 0) + 1;
    await this.cache.set(key, count, VELOCITY_WINDOW_SECONDS * 1000);
    if (count > MAX_PURCHASES_PER_HOUR) {
      throw new HttpException('PURCHASE_VELOCITY_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /** Called after N failed verification attempts for the same user (wired in controllers). */
  async recordFailedVerification(userId: string): Promise<number> {
    const key = `fraud:failed-verify:${userId}`;
    const count = ((await this.cache.get<number>(key)) ?? 0) + 1;
    await this.cache.set(key, count, VELOCITY_WINDOW_SECONDS * 1000);
    return count;
  }

  /** doc: a purchase count anomaly for admin dashboard triage, not an auto-block. */
  async recentPurchaseCount(userId: string, hours = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.purchases
      .createQueryBuilder('p')
      .where('p.user_id = :userId', { userId })
      .andWhere('p.created_at > :since', { since })
      .getCount();
  }
}
