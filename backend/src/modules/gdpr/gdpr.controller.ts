import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitAuth } from '../../common/decorators/rate-limit.decorator';
import { DataExportService } from './data-export.service';
import { DataDeletionService } from './data-deletion.service';

@ApiTags('GDPR')
@ApiBearerAuth()
@Controller('gdpr')
export class GdprController {
  constructor(
    private readonly exportService: DataExportService,
    private readonly deletionService: DataDeletionService,
    @InjectQueue('gdpr-deletion') private readonly deletionQueue: Queue,
  ) {}

  @Get('export')
  @RateLimitAuth() // doc 31: a full data export is expensive to generate — same tight tier as auth endpoints, not the general 300/min default
  @ApiOperation({ summary: 'Right to Access (GDPR Art. 15) — export your data as structured JSON' })
  async export(@CurrentUser('id') userId: string) {
    return this.exportService.exportForUser(userId);
  }

  @Post('delete-account')
  @RateLimitAuth()
  @ApiOperation({ summary: 'Right to Erasure (GDPR Art. 17) — request account deletion, processed via a background job (doc 18)' })
  async requestDeletion(@CurrentUser('id') userId: string) {
    const request = await this.deletionService.requestDeletion(userId);
    await this.deletionQueue.add('process-deletion', { requestId: request.id });
    return { requestId: request.id, status: 'pending' };
  }
}
