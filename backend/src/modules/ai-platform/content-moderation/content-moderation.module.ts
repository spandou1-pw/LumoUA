import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModerationFlag } from './entities/ai-moderation-flag.entity';
import { TextModerationProvider } from './providers/text-moderation.provider';
import { VisualModerationProvider } from './providers/visual-moderation.provider';
import { ContentModerationService } from './content-moderation.service';
import { PostModerationListener } from './post-moderation.listener';
import { SafetyFiltersModule } from '../safety-filters/safety-filters.module';
import { ModerationModule } from '../../moderation/moderation.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiModerationFlag]), SafetyFiltersModule, ModerationModule],
  providers: [TextModerationProvider, VisualModerationProvider, ContentModerationService, PostModerationListener],
  exports: [ContentModerationService],
})
export class ContentModerationModule {}
