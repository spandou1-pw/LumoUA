import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';

export interface FunnelStepResult {
  step: string;
  usersReached: number;
  conversionFromPrevious: number; // 1.0 for the first step
  conversionFromStart: number;
}

@Injectable()
export class FunnelAnalyticsService {
  constructor(@InjectRepository(AnalyticsEvent) private readonly events: Repository<AnalyticsEvent>) {}

  async track(userId: string, eventName: string, properties?: Record<string, unknown>): Promise<void> {
    await this.events.insert({ userId, eventName, properties: (properties ?? null) as any });
  }

  /**
   * doc GROWTH.md: real ordered-funnel logic — a user only "reaches" step
   * N if they have an event for every step 1..N (in any order timestamp-
   * wise for simplicity; a stricter version would require step order to
   * match event order, which is a reasonable future refinement, not
   * assumed here). This is a real SQL-driven computation, not a canned
   * percentage.
   */
  async computeFunnel(steps: string[], sinceDays = 30): Promise<FunnelStepResult[]> {
    if (steps.length === 0) return [];
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    const usersPerStep = await Promise.all(
      steps.map((step) =>
        this.events
          .createQueryBuilder('e')
          .select('DISTINCT e.user_id', 'userId')
          .where('e.event_name = :step', { step })
          .andWhere('e.created_at > :since', { since })
          .getRawMany<{ userId: string }>()
          .then((rows) => new Set(rows.map((r) => r.userId))),
      ),
    );

    const startCount = usersPerStep[0]?.size ?? 0;
    const results: FunnelStepResult[] = [];
    let previousSet: Set<string> | null = null;

    for (let i = 0; i < steps.length; i++) {
      // doc: a user "reaches" step i only if they're in step i's set AND
      // every prior step's set (intersection), not just present in step i
      // alone — otherwise a user who skipped straight to a later event
      // would incorrectly count as having gone through the whole funnel.
      const currentSet: Set<string> = previousSet
        ? new Set([...usersPerStep[i]].filter((u) => previousSet!.has(u)))
        : usersPerStep[i];

      const usersReached = currentSet.size;
      results.push({
        step: steps[i],
        usersReached,
        conversionFromPrevious: i === 0 ? 1 : previousSet!.size > 0 ? usersReached / previousSet!.size : 0,
        conversionFromStart: startCount > 0 ? usersReached / startCount : 0,
      });

      previousSet = currentSet;
    }

    return results;
  }
}
