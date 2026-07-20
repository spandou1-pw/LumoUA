import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModerationFlag, ModerationTargetType } from './entities/ai-moderation-flag.entity';
import { TextModerationProvider } from './providers/text-moderation.provider';
import { SafetyFiltersService } from '../safety-filters/safety-filters.service';
import { ReportsService } from '../../moderation/reports.service';

/**
 * doc 33: "No fully automated ban pipeline... requires the human action
 * step" — this service creates flags and Reports for human review; it
 * NEVER calls PostsService.moderatorRemove or any account-status change
 * directly. The only thing that removes content or changes an account is
 * a human moderator acting on the Report this produces (Stage 13's
 * `ModerationAdminController`).
 */
@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  constructor(
    @InjectRepository(AiModerationFlag) private readonly flags: Repository<AiModerationFlag>,
    private readonly textProvider: TextModerationProvider,
    private readonly safetyFilters: SafetyFiltersService,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * Called asynchronously after content creation (doc 18: never inline in
   * the write path — moderation checks must not add latency to posting).
   * Two layers: (1) the fast, deterministic, DB-managed safety filter
   * (always available, no external dependency) and (2) the deeper AI
   * classifier (best-effort — if unconfigured/down, logged and skipped,
   * never blocking or crashing the caller).
   */
  async screenText(targetType: ModerationTargetType, targetId: string, text: string): Promise<void> {
    const filterHit = await this.safetyFilters.check(text);
    if (filterHit) {
      await this.createFlag(targetType, targetId, filterHit.category, filterHit.severity, 'safety-filter');
    }

    try {
      const results = await this.textProvider.classify(text);
      for (const result of results) {
        if (result.confidence >= 60) {
          await this.createFlag(targetType, targetId, result.category, result.confidence, 'text-classifier');
        }
      }
    } catch (err) {
      // doc: provider unavailability is an ops signal, not a reason to
      // fail content creation — the safety-filter layer above still ran
      // regardless of whether the deeper classifier is configured.
      this.logger.warn(`Text classifier unavailable for ${targetType}:${targetId} — ${(err as Error).message}`);
    }
  }

  private async createFlag(
    targetType: ModerationTargetType,
    targetId: string,
    category: AiModerationFlag['category'],
    confidence: number,
    provider: string,
  ): Promise<void> {
    // doc 32/33: self-harm and illegal-content flags get immediate,
    // priority human review — filing a structured Report is what actually
    // achieves that (Stage 13's severity-first queue already prioritizes
    // these reasons above everything else, so routing through the same
    // Report table rather than a separate AI-only queue means the
    // priority logic isn't duplicated).
    const reportReason = category === 'self_harm' ? 'self_harm' : category === 'hate_speech' ? 'hate_speech' : 'other';
    const report = await this.reportsService.file(
      null, // doc: AI-filed reports have no human reporter — reporter_id is a real FK to users(id)
      targetType === 'image' || targetType === 'video' ? 'post' : targetType,
      targetId,
      reportReason,
      `AI-flagged: ${category} (confidence ${confidence}%, provider: ${provider})`,
      true, // filedByAi
    );

    await this.flags.save(
      this.flags.create({ targetType, targetId, category, confidence, provider, reportId: report.id }),
    );
  }
}
