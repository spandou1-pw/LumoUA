import { percentile } from '../../src/modules/analytics/crash-performance/percentile';

describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 95)).toBe(0);
  });

  it('returns the single value for a one-element array at any percentile', () => {
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 99)).toBe(42);
  });

  it('p0 returns the minimum value', () => {
    expect(percentile([10, 20, 30, 40, 50], 0)).toBe(10);
  });

  it('p100 returns the maximum value', () => {
    expect(percentile([10, 20, 30, 40, 50], 100)).toBe(50);
  });

  it('p50 (median) of an odd-length sorted array is the middle value', () => {
    expect(percentile([10, 20, 30, 40, 50], 50)).toBe(30);
  });

  it('computes a known p95 correctly for a simple dataset', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
    // p95 of 1..100 (0-indexed interpolation) lands very close to 95.05
    expect(percentile(values, 95)).toBeCloseTo(95.05, 1);
  });

  it('interpolates between two values when the percentile falls between indices', () => {
    const result = percentile([10, 20], 50);
    expect(result).toBe(15); // exact midpoint
  });
});
