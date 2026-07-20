import { Test, TestingModule } from '@nestjs/testing';
import { BotDetectionService } from '../../src/modules/bot-detection/bot-detection.service';
import { CaptchaVerificationProvider } from '../../src/modules/bot-detection/providers/captcha-verification.provider';

describe('BotDetectionService', () => {
  let service: BotDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotDetectionService, { provide: CaptchaVerificationProvider, useValue: { verify: jest.fn() } }],
    }).compile();
    service = module.get(BotDetectionService);
  });

  describe('checkHoneypot', () => {
    it('returns false (not a bot) when the honeypot field is empty — real users never see/fill it', () => {
      expect(service.checkHoneypot('')).toBe(false);
      expect(service.checkHoneypot(undefined)).toBe(false);
    });

    it('returns true (bot suspected) when the honeypot field has any value', () => {
      expect(service.checkHoneypot('bots fill this')).toBe(true);
    });

    it('returns false for a whitespace-only honeypot value (treated as effectively empty)', () => {
      expect(service.checkHoneypot('   ')).toBe(false);
    });
  });

  describe('checkSubmissionTiming', () => {
    it('flags a sub-second form submission as suspicious', () => {
      const rendered = new Date('2026-07-18T12:00:00.000Z');
      const submitted = new Date('2026-07-18T12:00:00.500Z');
      expect(service.checkSubmissionTiming(rendered, submitted)).toBe(true);
    });

    it('does not flag a normal-paced human submission', () => {
      const rendered = new Date('2026-07-18T12:00:00.000Z');
      const submitted = new Date('2026-07-18T12:00:15.000Z');
      expect(service.checkSubmissionTiming(rendered, submitted)).toBe(false);
    });

    it('respects a custom minimum-seconds threshold', () => {
      const rendered = new Date('2026-07-18T12:00:00.000Z');
      const submitted = new Date('2026-07-18T12:00:03.000Z');
      expect(service.checkSubmissionTiming(rendered, submitted, 5)).toBe(true);
      expect(service.checkSubmissionTiming(rendered, submitted, 2)).toBe(false);
    });
  });
});
