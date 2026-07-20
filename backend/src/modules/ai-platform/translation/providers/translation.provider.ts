import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage: string;
}

/**
 * doc PROFILE.md/doc 48 boundary reminder: automatic translation applies
 * ONLY to UI chrome or an explicit user-triggered "translate this post"
 * action — it must never silently alter user-generated content as
 * originally authored/displayed by default (doc 48: "user-generated
 * content is never translated or altered... rendered exactly as
 * authored"). This provider exists to power an opt-in "translate" button
 * a post/comment could offer, not an automatic default.
 *
 * WHAT'S REAL vs STUBBED: orchestration is real; the actual translation
 * call needs a real provider (Google Cloud Translation, DeepL, or Azure
 * Translator) and API key — none configured here, same honesty pattern
 * as every other external AI dependency in this stage.
 */
@Injectable()
export class TranslationProvider {
  private readonly logger = new Logger(TranslationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async translate(text: string, targetLanguage: 'uk' | 'en'): Promise<TranslationResult> {
    const apiKey = this.config.get<string>('TRANSLATION_API_KEY');
    if (!apiKey) {
      this.logger.warn(`Translation requested (${text.length} chars -> ${targetLanguage}) but TRANSLATION_API_KEY is not configured`);
      throw new Error('NOT_IMPLEMENTED: requires TRANSLATION_API_KEY (Google Cloud Translation / DeepL / Azure Translator)');
    }
    // TODO(production): call the chosen provider's API and map its response here.
    throw new Error('NOT_IMPLEMENTED: provider API call not wired');
  }
}
