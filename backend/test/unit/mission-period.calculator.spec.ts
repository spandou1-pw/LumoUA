import { MissionPeriodCalculator } from '../../src/modules/growth/missions/mission-period.calculator';

describe('MissionPeriodCalculator', () => {
  it('dailyKey returns a stable YYYY-MM-DD for the same UTC day', () => {
    const morning = new Date('2026-07-18T01:00:00Z');
    const evening = new Date('2026-07-18T23:00:00Z');
    expect(MissionPeriodCalculator.dailyKey(morning)).toBe('2026-07-18');
    expect(MissionPeriodCalculator.dailyKey(evening)).toBe('2026-07-18');
  });

  it('dailyKey differs across a UTC day boundary', () => {
    const day1 = new Date('2026-07-18T23:59:00Z');
    const day2 = new Date('2026-07-19T00:01:00Z');
    expect(MissionPeriodCalculator.dailyKey(day1)).not.toBe(MissionPeriodCalculator.dailyKey(day2));
  });

  it('weeklyKey groups a Monday-to-Sunday span into the same week', () => {
    const monday = new Date('2026-07-20T00:00:00Z');
    const sunday = new Date('2026-07-26T23:00:00Z');
    expect(MissionPeriodCalculator.weeklyKey(monday)).toBe(MissionPeriodCalculator.weeklyKey(sunday));
  });

  it('weeklyKey differs across a week boundary', () => {
    const thisWeek = new Date('2026-07-20T00:00:00Z'); // Monday
    const nextWeek = new Date('2026-07-27T00:00:00Z'); // next Monday
    expect(MissionPeriodCalculator.weeklyKey(thisWeek)).not.toBe(MissionPeriodCalculator.weeklyKey(nextWeek));
  });

  it('weeklyKey handles the year-boundary edge case correctly (ISO week 1 can start in the prior calendar year)', () => {
    // Jan 1, 2027 is a Friday — per ISO 8601, it belongs to week 53 of 2026,
    // not week 1 of 2027. This is exactly the kind of off-by-one that a
    // naive "week number" implementation gets wrong.
    const key = MissionPeriodCalculator.weeklyKey(new Date('2027-01-01T00:00:00Z'));
    expect(key.startsWith('2026-')).toBe(true);
  });

  it('periodKeyFor dispatches to the correct calculator per period type', () => {
    const date = new Date('2026-07-18T12:00:00Z');
    expect(MissionPeriodCalculator.periodKeyFor('daily', date)).toBe(MissionPeriodCalculator.dailyKey(date));
    expect(MissionPeriodCalculator.periodKeyFor('weekly', date)).toBe(MissionPeriodCalculator.weeklyKey(date));
    expect(MissionPeriodCalculator.periodKeyFor('seasonal', date)).toBe('seasonal');
  });
});
