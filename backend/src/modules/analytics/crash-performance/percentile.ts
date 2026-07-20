/**
 * doc 05/46: every performance NFR in this project is stated as a
 * percentile (e.g. "p95 <= 300ms"), never a mean — a mean hides the tail
 * latency that actually determines whether real users have a bad
 * experience. This function is the one place that percentile math
 * happens, kept pure so it's directly unit-testable independent of any
 * database query.
 */
export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (p <= 0) return sortedValues[0];
  if (p >= 100) return sortedValues[sortedValues.length - 1];

  const index = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];

  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}
