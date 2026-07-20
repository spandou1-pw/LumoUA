import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * doc GROWTH.md "Email Campaigns": orchestration is real; the actual send
 * needs a real provider (SendGrid, Postmark, AWS SES) and API key —
 * unconfigured here, same honest pattern as every other external
 * dependency in this codebase (doc 6/14's providers).
 */
@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    const apiKey = this.config.get<string>('EMAIL_PROVIDER_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        `Email send requested (to=${to}, subject="${subject}", ${body.length} char body) but EMAIL_PROVIDER_API_KEY is not configured`,
      );
      throw new Error('NOT_IMPLEMENTED: requires EMAIL_PROVIDER_API_KEY (SendGrid / Postmark / AWS SES)');
    }
    // TODO(production): call the chosen provider's transactional send API.
    throw new Error('NOT_IMPLEMENTED: email provider API call not wired');
  }
}
