import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface AccountSignals {
  createdAt: Date;
  hasAvatar: boolean;
  hasBio: boolean;
  email: string;
  followCountSinceSignup: number;
}

export interface FakeAccountRiskResult {
  riskScore: number; // 0-100, higher = more suspicious
  reasons: string[];
}

/**
 * doc AI.md "Fake Account Detection": a deterministic risk score from
 * observable signals — no behavioral ML model (that would need labeled
 * training data this platform doesn't have yet). This score feeds
 * moderator triage (doc 32's queue), it never auto-suspends an account —
 * same human-in-the-loop boundary as every other AI-adjacent feature in
 * this stage.
 *
 * doc PAYMENTS.md precedent: a hardcoded disposable-email-domain list
 * would go stale fast and isn't the kind of thing worth maintaining by
 * hand in source — a real deployment would use a maintained third-party
 * list/API (e.g. a disposable-domain-checking service) for that specific
 * signal; it's omitted here rather than shipped with a stale, easily
 * bypassed hardcoded list that would create false confidence.
 */
@Injectable()
export class FakeAccountDetectionService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  assess(signals: AccountSignals): FakeAccountRiskResult {
    const reasons: string[] = [];
    let score = 0;

    if (!signals.hasAvatar && !signals.hasBio) {
      score += 20;
      reasons.push('empty_profile');
    }

    const accountAgeHours = (Date.now() - signals.createdAt.getTime()) / (1000 * 60 * 60);
    if (accountAgeHours < 1 && signals.followCountSinceSignup > 50) {
      // doc: a brand-new account following 50+ people within its first
      // hour is a strong bot-farm/follow-spam signal — real users build
      // their graph gradually, not in a burst immediately at signup.
      score += 40;
      reasons.push('mass_follow_immediately_after_signup');
    } else if (accountAgeHours < 24 && signals.followCountSinceSignup > 200) {
      score += 25;
      reasons.push('high_follow_velocity_new_account');
    }

    if (this.looksLikeGeneratedEmail(signals.email)) {
      score += 15;
      reasons.push('generated_looking_email_pattern');
    }

    return { riskScore: Math.min(score, 100), reasons };
  }

  /**
   * doc: a narrow, deliberately conservative pattern check (long
   * random-looking local-part before the @) — not a broad "looks weird"
   * heuristic that would false-positive on real people's addresses.
   */
  private looksLikeGeneratedEmail(email: string): boolean {
    const localPart = email.split('@')[0] ?? '';
    const hasNoVowelsAndIsLong = localPart.length >= 12 && !/[aeiouаеєиіїоуюя]/i.test(localPart);
    const isHighEntropyHex = /^[a-f0-9]{16,}$/i.test(localPart);
    return hasNoVowelsAndIsLong || isHighEntropyHex;
  }

  /** doc: burst-signup detection — many accounts created from a pattern in a short window (e.g. same IP/device, tracked elsewhere) is a stronger signal than any single-account heuristic; this counter is the primitive other code would call at registration time. */
  async recordSignupAndCheckBurst(bucketKey: string, windowSeconds = 3600, threshold = 10): Promise<boolean> {
    const cacheKey = `fake-account:signup-burst:${bucketKey}`;
    const count = ((await this.cache.get<number>(cacheKey)) ?? 0) + 1;
    await this.cache.set(cacheKey, count, windowSeconds * 1000);
    return count > threshold;
  }
}
