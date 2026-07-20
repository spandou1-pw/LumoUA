import { Throttle } from '@nestjs/throttler';

/**
 * doc 22 rate limits, doc 31 NFR-SEC-3 tiering:
 *  - auth: tightest (credential-stuffing resistance)
 *  - general authenticated API: looser
 *  - public unauthenticated reads: their own tier (anti-scraping, not
 *    blocking legitimate use)
 * Named tiers keep the actual numbers in one place instead of scattered
 * magic numbers across controllers.
 */
export const RateLimitAuth = () => Throttle({ default: { limit: 10, ttl: 3_600_000 } }); // 10/hour
export const RateLimitAuthLogin = () => Throttle({ default: { limit: 20, ttl: 3_600_000 } }); // 20/hour
export const RateLimitGeneral = () => Throttle({ default: { limit: 300, ttl: 60_000 } }); // 300/min
export const RateLimitPublicRead = () => Throttle({ default: { limit: 60, ttl: 60_000 } }); // 60/min
