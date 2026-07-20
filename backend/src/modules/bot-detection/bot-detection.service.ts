import { Injectable } from '@nestjs/common';
import { CaptchaVerificationProvider } from './providers/captcha-verification.provider';

/**
 * doc SECURITY.md "Bot Detection": layered like every other fraud/abuse
 * check in this codebase (doc PAYMENTS.md's FraudService, doc COINS.md's
 * WalletFraudService). The honeypot check is real and needs no external
 * dependency; CAPTCHA verification is the heavier, opt-in lever (doc 31)
 * for when honeypot + rate limiting (already built, Stage 4/31) aren't
 * enough.
 */
@Injectable()
export class BotDetectionService {
  constructor(private readonly captcha: CaptchaVerificationProvider) {}

  /**
   * doc: a hidden form field real users never see or fill (CSS-hidden on
   * the client) — a bot filling every field programmatically fills this
   * one too. Zero false-positive risk against real users, zero external
   * dependency, genuinely effective against unsophisticated scripted
   * signups. Not a defense against a targeted/sophisticated attacker —
   * that's what CAPTCHA + velocity limiting (doc PAYMENTS.md pattern,
   * already applied to registration via doc 31's rate limits) are for.
   */
  checkHoneypot(honeypotFieldValue: string | undefined): boolean {
    return !!honeypotFieldValue && honeypotFieldValue.trim().length > 0;
  }

  /** doc: form-fill speed — a real human takes at least a few seconds to read and fill a signup form; sub-second submission is a strong scripted-bot signal. */
  checkSubmissionTiming(formRenderedAt: Date, submittedAt: Date, minimumSeconds = 2): boolean {
    const elapsedSeconds = (submittedAt.getTime() - formRenderedAt.getTime()) / 1000;
    return elapsedSeconds < minimumSeconds;
  }

  async verifyCaptcha(token: string, remoteIp?: string): Promise<boolean> {
    return this.captcha.verify(token, remoteIp);
  }
}
