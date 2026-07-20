import { Module } from '@nestjs/common';
import { BotDetectionService } from './bot-detection.service';
import { CaptchaVerificationProvider } from './providers/captcha-verification.provider';

@Module({
  providers: [BotDetectionService, CaptchaVerificationProvider],
  exports: [BotDetectionService],
})
export class BotDetectionModule {}
