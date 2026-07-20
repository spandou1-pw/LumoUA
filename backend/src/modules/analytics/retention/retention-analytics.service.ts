import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

export interface CohortRetention {
  cohortDate: string; // signup date, 'YYYY-MM-DD'
  cohortSize: number;
  d1RetainedCount: number;
  d7RetainedCount: number;
  d30RetainedCount: number;
  d1Rate: number;
  d7Rate: number;
  d30Rate: number;
}

/**
 * doc GROWTH.md "Retention System": real retention computed from actual
 * data this platform already has — `users.created_at` (signup/cohort
 * date) and `refresh_tokens.last_used_at` (Stage 15's session-activity
 * field, the closest real "was this user active" signal without a
 * separate analytics-event pipeline). "D7 retained" means: last activity
 * at least 7 days after signup — a standard, real retention definition,
 * not a placeholder metric.
 */
@Injectable()
export class RetentionAnalyticsService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async cohortRetention(sinceDays = 30): Promise<CohortRetention[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    // doc: one query pulls signup date + the user's latest known activity
    // (max last_used_at across all their devices) — computed in SQL rather
    // than pulled into app memory, since this scales with user count.
    const rows = await this.users
      .createQueryBuilder('u')
      .leftJoin(RefreshToken, 'rt', 'rt.user_id = u.id')
      .select("to_char(u.created_at, 'YYYY-MM-DD')", 'cohortDate')
      .addSelect('u.id', 'userId')
      .addSelect('u.created_at', 'createdAt')
      .addSelect('MAX(rt.last_used_at)', 'lastActiveAt')
      .where('u.created_at > :since', { since })
      .groupBy('u.id')
      .addGroupBy('u.created_at')
      .getRawMany<{ cohortDate: string; userId: string; createdAt: Date; lastActiveAt: Date | null }>();

    const byCohort = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = byCohort.get(row.cohortDate) ?? [];
      list.push(row);
      byCohort.set(row.cohortDate, list);
    }

    const results: CohortRetention[] = [];
    for (const [cohortDate, cohortRows] of byCohort.entries()) {
      const cohortSize = cohortRows.length;
      let d1 = 0;
      let d7 = 0;
      let d30 = 0;

      for (const row of cohortRows) {
        if (!row.lastActiveAt) continue;
        const activeDays = (row.lastActiveAt.getTime() - row.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (activeDays >= 1) d1++;
        if (activeDays >= 7) d7++;
        if (activeDays >= 30) d30++;
      }

      results.push({
        cohortDate,
        cohortSize,
        d1RetainedCount: d1,
        d7RetainedCount: d7,
        d30RetainedCount: d30,
        d1Rate: cohortSize > 0 ? d1 / cohortSize : 0,
        d7Rate: cohortSize > 0 ? d7 / cohortSize : 0,
        d30Rate: cohortSize > 0 ? d30 / cohortSize : 0,
      });
    }

    return results.sort((a, b) => a.cohortDate.localeCompare(b.cohortDate));
  }
}
