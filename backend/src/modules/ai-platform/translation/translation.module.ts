import { Module } from '@nestjs/common';
import { TranslationProvider } from './providers/translation.provider';
import { TranslationController } from './translation.controller';

@Module({
  controllers: [TranslationController],
  providers: [TranslationProvider],
  exports: [TranslationProvider],
})
export class TranslationModule {}
