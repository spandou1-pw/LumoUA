import { assignVariant } from '../../src/modules/growth/ab-testing/variant-assignment';

describe('assignVariant', () => {
  const variants = [
    { key: 'control', weight: 50 },
    { key: 'treatment', weight: 50 },
  ];

  it('is deterministic — the same user+experiment always gets the same variant', () => {
    const first = assignVariant('user-42', 'exp-1', variants);
    const second = assignVariant('user-42', 'exp-1', variants);
    expect(first).toBe(second);
  });

  it('different users can land on different variants', () => {
    const results = new Set(Array.from({ length: 30 }, (_, i) => assignVariant(`user-${i}`, 'exp-1', variants)));
    expect(results.size).toBeGreaterThan(1);
  });

  it('the same user gets different assignments for different experiments (no cross-experiment correlation)', () => {
    // Not guaranteed to differ for any single pair (50/50 coin flip could
    // coincide), but across many experiment keys the assignment shouldn't
    // be trivially identical every time.
    const assignments = Array.from({ length: 20 }, (_, i) => assignVariant('user-1', `exp-${i}`, variants));
    expect(new Set(assignments).size).toBeGreaterThan(1);
  });

  it('a 100/0 weight split always assigns the 100-weight variant', () => {
    const skewed = [
      { key: 'always', weight: 100 },
      { key: 'never', weight: 0 },
    ];
    for (let i = 0; i < 20; i++) {
      expect(assignVariant(`user-${i}`, 'exp-skewed', skewed)).toBe('always');
    }
  });

  it('roughly respects weighted distribution across many users (statistical, not exact)', () => {
    const weighted = [
      { key: 'small', weight: 10 },
      { key: 'large', weight: 90 },
    ];
    const assignments = Array.from({ length: 2000 }, (_, i) => assignVariant(`user-${i}`, 'exp-weighted', weighted));
    const smallCount = assignments.filter((a) => a === 'small').length;
    const smallRatio = smallCount / assignments.length;
    // Expect roughly 10%, with generous tolerance since this is a hash-based
    // distribution over a finite sample, not a true random draw.
    expect(smallRatio).toBeGreaterThan(0.05);
    expect(smallRatio).toBeLessThan(0.15);
  });

  it('throws for an experiment with no variants', () => {
    expect(() => assignVariant('user-1', 'exp-empty', [])).toThrow('EXPERIMENT_HAS_NO_VARIANTS');
  });

  it('throws when total weight is zero or negative', () => {
    expect(() => assignVariant('user-1', 'exp-zero', [{ key: 'a', weight: 0 }])).toThrow(
      'EXPERIMENT_TOTAL_WEIGHT_MUST_BE_POSITIVE',
    );
  });
});
