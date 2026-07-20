import { MissionPeriod } from './entities/mission-definition.entity';

/**
 * doc GROWTH.md: pure functions computing the current period key for
 * daily/weekly missions — isolated from any service so the boundary logic
 * (especially ISO week calculation, a classic source of off-by-one bugs
 * around year boundaries) is directly unit-testable.
 */
export class MissionPeriodCalculator {
  static periodKeyFor(period: MissionPeriod, date: Date = new Date()): string {
    switch (period) {
      case 'daily':
        return this.dailyKey(date);
      case 'weekly':
        return this.weeklyKey(date);
      case 'seasonal':
        return 'seasonal'; // doc: seasonal missions are scoped by the mission's own seasonTag/availability window, not a rolling period key
    }
  }

  static dailyKey(date: Date): string {
    return date.toISOString().slice(0, 10); // 'YYYY-MM-DD', UTC
  }

  /** ISO 8601 week number — Monday-start weeks, week 1 contains the year's first Thursday. */
  static weeklyKey(date: Date): string {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = d.getUTCDay() || 7; // Sunday (0) -> 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // move to this week's Thursday
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }
}
