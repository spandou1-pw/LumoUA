import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DataDeletionService } from './data-deletion.service';

@Processor('gdpr-deletion')
export class DataDeletionProcessor {
  private readonly logger = new Logger(DataDeletionProcessor.name);

  constructor(private readonly deletionService: DataDeletionService) {}

  @Process('process-deletion')
  async handle(job: Job<{ requestId: string }>): Promise<void> {
    await this.deletionService.processDeletion(job.data.requestId);
    this.logger.log(`Deletion request ${job.data.requestId} processed`);
  }
}
