import * as crypto from 'crypto';
import { ExperimentVariant } from './entities/experiment.entity';

/**
 * doc SECURITY.md flagged real A/B testing as "not attempted" — this is
 * that real implementation. Same deterministic-hash-bucketing principle
 * as `FeatureFlagsService` (Stage 13), extended from a binary on/off to N
 * weighted variants: hash(userId + experimentKey) maps to a point in
 * [0, totalWeight), and the variant whose cumulative weight range
 * contains that point is the assignment. A user always lands on the same
 * variant for the same experiment across requests.
 */
export function assignVariant(userId: string, experimentKey: string, variants: ExperimentVariant[]): string {
  if (variants.length === 0) throw new Error('EXPERIMENT_HAS_NO_VARIANTS');

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) throw new Error('EXPERIMENT_TOTAL_WEIGHT_MUST_BE_POSITIVE');

  const hash = crypto.createHash('md5').update(`${userId}:${experimentKey}`).digest('hex');
  const bucket = (parseInt(hash.slice(0, 8), 16) % 10000) / 10000; // a float in [0, 1)
  const point = bucket * totalWeight;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (point < cumulative) return variant.key;
  }
  return variants[variants.length - 1].key; // floating-point edge case fallback
}
