import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experiment } from './entities/experiment.entity';
import { ExperimentEvent } from './entities/experiment-event.entity';
import { assignVariant } from './variant-assignment';

export interface ExperimentResult {
  variantKey: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
}

@Injectable()
export class AbTestingService {
  constructor(
    @InjectRepository(Experiment) private readonly experiments: Repository<Experiment>,
    @InjectRepository(ExperimentEvent) private readonly events: Repository<ExperimentEvent>,
  ) {}

  /** doc: assigns (deterministically) AND logs an exposure in one call — a client asking "which variant am I in" IS the exposure event. */
  async getAssignment(userId: string, experimentKey: string): Promise<string | null> {
    const experiment = await this.experiments.findOne({ where: { key: experimentKey, active: true } });
    if (!experiment) return null;

    const variantKey = assignVariant(userId, experimentKey, experiment.variants);

    // doc: idempotent-ish via a lightweight existence check — avoids
    // logging a fresh exposure row on every single page load for the same
    // user/experiment, while still being simple (not a full upsert-with-
    // count, since exposure count itself isn't the metric of interest —
    // "did this user see this variant at all" is).
    const alreadyLogged = await this.events.exist({
      where: { experimentKey, variantKey, userId, eventType: 'exposure' },
    });
    if (!alreadyLogged) {
      await this.events.insert({ experimentKey, variantKey, userId, eventType: 'exposure' });
    }

    return variantKey;
  }

  async logConversion(userId: string, experimentKey: string, conversionGoal: string): Promise<void> {
    const variantKey = assignVariant(
      userId,
      experimentKey,
      (await this.experiments.findOne({ where: { key: experimentKey } }))?.variants ?? [],
    );
    if (!variantKey) return;

    await this.events.insert({ experimentKey, variantKey, userId, eventType: 'conversion', conversionGoal });
  }

  /**
   * doc GROWTH.md: honest conversion rates per variant — deliberately NO
   * statistical-significance calculation (chi-squared, p-value, confidence
   * interval). Presenting a p-value without knowing this platform's actual
   * traffic/variance characteristics risks a confidently-wrong "this is
   * significant" claim on too little data. A real significance test is a
   * legitimate next addition once there's a stats library decision to
   * make deliberately, not a default assumed here.
   */
  async results(experimentKey: string): Promise<ExperimentResult[]> {
    const rows = await this.events
      .createQueryBuilder('e')
      .select('e.variant_key', 'variantKey')
      .addSelect('e.event_type', 'eventType')
      .addSelect('COUNT(DISTINCT e.user_id)', 'count')
      .where('e.experiment_key = :experimentKey', { experimentKey })
      .groupBy('e.variant_key')
      .addGroupBy('e.event_type')
      .getRawMany<{ variantKey: string; eventType: string; count: string }>();

    const byVariant = new Map<string, { exposures: number; conversions: number }>();
    for (const row of rows) {
      const entry = byVariant.get(row.variantKey) ?? { exposures: 0, conversions: 0 };
      if (row.eventType === 'exposure') entry.exposures = Number(row.count);
      if (row.eventType === 'conversion') entry.conversions = Number(row.count);
      byVariant.set(row.variantKey, entry);
    }

    return Array.from(byVariant.entries()).map(([variantKey, { exposures, conversions }]) => ({
      variantKey,
      exposures,
      conversions,
      conversionRate: exposures > 0 ? conversions / exposures : 0,
    }));
  }
}
