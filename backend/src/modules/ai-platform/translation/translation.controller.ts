import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimitGeneral } from '../../../common/decorators/rate-limit.decorator';
import { TranslationProvider } from './providers/translation.provider';

@ApiTags('Translation')
@ApiBearerAuth()
@Controller('translation')
export class TranslationController {
  constructor(private readonly translationProvider: TranslationProvider) {}

  @Post('translate')
  @RateLimitGeneral()
  @ApiOperation({
    summary:
      'Opt-in translation of a specific piece of text (e.g. a "Translate this post" tap) — doc 48: never applied automatically or by default',
  })
  async translate(@Body('text') text: string, @Body('targetLanguage') targetLanguage: 'uk' | 'en') {
    return this.translationProvider.translate(text, targetLanguage);
  }
}
