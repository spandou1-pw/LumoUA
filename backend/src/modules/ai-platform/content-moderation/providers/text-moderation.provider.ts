import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModerationCategory } from '../entities/ai-moderation-flag.entity';

export interface TextClassificationResult {
  category: ModerationCategory;
  confidence: number; // 0-100
}

/**
 * doc 33: "Ukrainian-language-specific model... a model trained primarily
 * on English hate-speech datasets performs poorly on Ukrainian slang" —
 * WHAT'S REAL vs STUBBED (same standard as every external-dependency
 * integration point since Stage 6):
 * - The orchestration (classify -> map to categories -> return typed
 *   results) is real and is what ContentModerationService calls.
 * - The actual classification requires a real provider: options include
 *   Perspective API (Google Jigsaw — has some non-English support but
 *   Ukrainian coverage should be verified before relying on it) or a
 *   fine-tuned open-source multilingual model served behind your own
 *   inference endpoint (doc 33's stated preference for Phase 3, given
 *   team-size constraints on training from scratch). Neither is wired
 *   here — this throws clearly rather than returning fake "all clear"
 *   results, which would be actively dangerous (silently approving
 *   content nobody actually checked).
 */
@Injectable()
export class TextModerationProvider {
  private readonly logger = new Logger(TextModerationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async classify(text: string): Promise<TextClassificationResult[]> {
    const apiKey = this.config.get<string>('TEXT_MODERATION_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        `TextModerationProvider.classify called (${text.length} chars) but TEXT_MODERATION_API_KEY is not configured`,
      );
      throw new Error(
        'NOT_IMPLEMENTED: requires TEXT_MODERATION_API_KEY (Perspective API, OpenAI Moderation, or a self-hosted multilingual classifier — doc 33)',
      );
    }

    // TODO(production): call the chosen provider's API here, e.g.:
    //   const res = await fetch('https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=' + apiKey, {...})
    // then map the provider's response shape into TextClassificationResult[].
    throw new Error('NOT_IMPLEMENTED: provider API call not wired');
  }
}
