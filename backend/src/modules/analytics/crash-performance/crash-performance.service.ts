import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrashReport } from './entities/crash-report.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { percentile } from './percentile';

@Injectable()
export class CrashPerformanceService {
  constructor(
    @InjectRepository(CrashReport) private readonly crashes: Repository<CrashReport>,
    @InjectRepository(PerformanceMetric) private readonly metrics: Repository<PerformanceMetric>,
  ) {}

  async reportCrash(input: Omit<CrashReport, 'id' | 'createdAt'>): Promise<void> {
    await this.crashes.insert(input);
  }

  async reportPerformanceMetric(input: Omit<PerformanceMetric, 'id' | 'createdAt'>): Promise<void> {
    await this.metrics.insert(input);
  }

  async crashRateByVersion(sinceDays = 7): Promise<{ appVersion: string; platform: string; crashCount: number }[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.crashes
      .createQueryBuilder('c')
      .select('c.app_version', 'appVersion')
      .addSelect('c.platform', 'platform')
      .addSelect('COUNT(*)', 'crashCount')
      .where('c.created_at > :since', { since })
      .groupBy('c.app_version')
      .addGroupBy('c.platform')
      .orderBy('"crashCount"', 'DESC')
      .getRawMany<{ appVersion: string; platform: string; crashCount: string }>();
    return rows.map((r) => ({ ...r, crashCount: Number(r.crashCount) }));
  }

  /** doc 05/46: real p50/p95/p99 against the actual reported durations — not a mean, per the percentile.ts rationale. */
  async performancePercentiles(
    metricName: string,
    platform?: string,
    sinceDays = 7,
  ): Promise<{ p50: number; p95: number; p99: number; sampleCount: number }> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const qb = this.metrics
      .createQueryBuilder('m')
      .select('m.duration_ms', 'durationMs')
      .where('m.metric_name = :metricName', { metricName })
      .andWhere('m.created_at > :since', { since });
    if (platform) qb.andWhere('m.platform = :platform', { platform });

    const rows = await qb.getRawMany<{ durationMs: number }>();
    const sorted = rows.map((r) => Number(r.durationMs)).sort((a, b) => a - b);

    return {
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      sampleCount: sorted.length,
    };
  }
}
