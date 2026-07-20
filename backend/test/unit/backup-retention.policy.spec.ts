import {
  isWithinRetention,
  shouldCreateWeeklyCopy,
  shouldCreateMonthlyCopy,
  retentionDaysFor,
} from '../../src/common/backup/backup-retention.policy';

describe('backup retention policy (doc 45)', () => {
  const now = new Date('2026-07-18T00:00:00Z'); // a Saturday

  describe('isWithinRetention', () => {
    it('a daily backup from yesterday is within retention', () => {
      const yesterday = new Date('2026-07-17T00:00:00Z');
      expect(isWithinRetention(yesterday, 'daily', now)).toBe(true);
    });

    it('a daily backup older than 30 days is NOT within retention', () => {
      const old = new Date('2026-06-01T00:00:00Z'); // ~47 days before `now`
      expect(isWithinRetention(old, 'daily', now)).toBe(false);
    });

    it('a weekly backup survives well past the daily retention window', () => {
      const sixWeeksAgo = new Date('2026-06-06T00:00:00Z');
      expect(isWithinRetention(sixWeeksAgo, 'daily', now)).toBe(false);
      expect(isWithinRetention(sixWeeksAgo, 'weekly', now)).toBe(true);
    });

    it('a monthly backup survives well past the weekly retention window', () => {
      const eightMonthsAgo = new Date('2025-11-18T00:00:00Z');
      expect(isWithinRetention(eightMonthsAgo, 'weekly', now)).toBe(false);
      expect(isWithinRetention(eightMonthsAgo, 'monthly', now)).toBe(true);
    });

    it('a backup older than 2 years is not within monthly retention either', () => {
      const threeYearsAgo = new Date('2023-07-18T00:00:00Z');
      expect(isWithinRetention(threeYearsAgo, 'monthly', now)).toBe(false);
    });
  });

  describe('shouldCreateWeeklyCopy', () => {
    it('is true for a Monday', () => {
      expect(shouldCreateWeeklyCopy(new Date('2026-07-20T00:00:00Z'))).toBe(true); // a Monday
    });

    it('is false for a non-Monday', () => {
      expect(shouldCreateWeeklyCopy(new Date('2026-07-18T00:00:00Z'))).toBe(false); // a Saturday
    });
  });

  describe('shouldCreateMonthlyCopy', () => {
    it('is true for the 1st of the month', () => {
      expect(shouldCreateMonthlyCopy(new Date('2026-08-01T00:00:00Z'))).toBe(true);
    });

    it('is false for any other day', () => {
      expect(shouldCreateMonthlyCopy(new Date('2026-08-15T00:00:00Z'))).toBe(false);
    });
  });

  it('retentionDaysFor returns the documented values for each tier', () => {
    expect(retentionDaysFor('daily')).toBe(30);
    expect(retentionDaysFor('weekly')).toBe(180);
    expect(retentionDaysFor('monthly')).toBe(730);
  });
});
