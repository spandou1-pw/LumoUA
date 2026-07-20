import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * doc 31: "CAPTCHA or equivalent (e.g. Cloudflare Turnstile) on
 * registration if bot-driven fake-account creation becomes an observed
 * problem — not built preemptively in Phase 1 without evidence it's
 * needed, but flagged as the first lever to pull if it is." This provider
 * is that lever, ready to wire in — orchestration is real, the actual
 * Turnstile siteverify call needs a real secret key.
 */
@Injectable()
export class CaptchaVerificationProvider {
  private readonly logger = new Logger(CaptchaVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) {
      this.logger.warn(
        `CAPTCHA verification requested (token length ${token.length}, ip ${remoteIp ?? 'unknown'}) but TURNSTILE_SECRET_KEY is not configured — failing closed (rejecting), not open`,
      );
      // doc: unlike the AI classifiers (fail-open, best-effort), an
      // unconfigured CAPTCHA check fails CLOSED — if bot protection was
      // explicitly enabled for an endpoint, silently accepting every
      // request because the secret is missing would defeat the point of
      // turning it on. This is a deliberate asymmetry from doc 33/AI.md's
      // "unavailable classifier never blocks content creation" — CAPTCHA
      // is a gate the caller opted into, not a best-effort enrichment.
      return false;
    }

    // TODO(production): POST to https://challenges.cloudflare.com/turnstile/v0/siteverify
    // with { secret, response: token, remoteip: remoteIp } and check `.success`.
    throw new Error('NOT_IMPLEMENTED: Turnstile siteverify call not wired');
  }
}
