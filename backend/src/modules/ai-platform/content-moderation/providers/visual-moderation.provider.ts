import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VisualClassificationResult {
  category: 'graphic_violence' | 'nsfw' | 'other';
  confidence: number; // 0-100
}

/**
 * doc 33: "Prefer established, vetted third-party moderation APIs/models
 * for image/video classification... over training from scratch." This
 * covers both Image Moderation and Video Moderation from the Stage 14
 * request — video is handled as periodic frame sampling through the same
 * image classifier (a dedicated video-specific model is disproportionate
 * for this scale, per doc 33's own reasoning about matching effort to the
 * problem).
 *
 * WHAT'S REAL vs STUBBED: orchestration (fetch asset -> classify -> map
 * result) is real; the actual API call requires real credentials for a
 * provider like AWS Rekognition, Google Cloud Vision SafeSearch, or
 * Azure Content Moderator. None is wired here for the same reason as
 * every other unconfigured external dependency in this codebase — no
 * fake "looks clean" result is ever returned.
 */
@Injectable()
export class VisualModerationProvider {
  private readonly logger = new Logger(VisualModerationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async classifyImage(storageKey: string): Promise<VisualClassificationResult[]> {
    this.assertConfigured();
    this.logger.debug(`Would classify image at ${storageKey}`);
    // TODO(production): fetch the object from R2 (doc 30's storage key) and
    // submit to the chosen vision API, e.g. Rekognition's DetectModerationLabels.
    throw new Error('NOT_IMPLEMENTED: vision API call not wired');
  }

  /** doc: samples frames at a fixed interval rather than processing the whole video — proportionate to the risk/cost tradeoff for this scale. */
  async classifyVideoSampledFrames(storageKey: string, sampleIntervalSeconds = 5): Promise<VisualClassificationResult[]> {
    this.assertConfigured();
    this.logger.debug(`Would sample frames every ${sampleIntervalSeconds}s from ${storageKey}`);
    throw new Error('NOT_IMPLEMENTED: video frame extraction + vision API call not wired');
  }

  private assertConfigured(): void {
    if (!this.config.get<string>('VISUAL_MODERATION_API_KEY')) {
      this.logger.error('Visual moderation not configured — missing VISUAL_MODERATION_API_KEY');
      throw new Error('NOT_IMPLEMENTED: requires VISUAL_MODERATION_API_KEY (AWS Rekognition / Cloud Vision / Azure Content Moderator)');
    }
  }
}
