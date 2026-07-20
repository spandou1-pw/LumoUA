import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { Campaign } from './entities/campaign.entity';
import { CampaignsService } from './campaigns.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailProvider } from './providers/email.provider';
import { User } from '../users/entities/user.entity';

@Processor('campaign-dispatch')
export class CampaignDispatchProcessor {
  private readonly logger = new Logger(CampaignDispatchProcessor.name);

  constructor(
    @InjectRepository(Campaign) private readonly campaigns: Repository<Campaign>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly campaignsService: CampaignsService,
    private readonly notifications: NotificationsService,
    private readonly emailProvider: EmailProvider,
  ) {}

  @Process('dispatch')
  async handle(job: Job<{ campaignId: string }>): Promise<void> {
    const campaign = await this.campaigns.findOne({ where: { id: job.data.campaignId } });
    if (!campaign) return;

    await this.campaignsService.markStatus(campaign.id, 'sending');
    const userIds = await this.campaignsService.resolveSegmentUserIds(campaign.segment);
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        if (campaign.channel === 'push') {
          await this.notifications.notify(
            userId,
            'new_follower', // doc: placeholder type, same standing note as every other reused-enum-value case in this codebase
            { campaignId: campaign.id },
            campaign.title,
            campaign.body,
          );
        } else {
          const user = await this.users.findOne({ where: { id: userId } });
          if (user?.email) {
            await this.emailProvider.send(user.email, campaign.title, campaign.body);
          }
        }
        sent++;
      } catch (err) {
        // doc: an unconfigured EmailProvider throws for every recipient —
        // logged once per failure, doesn't abort the whole batch (a later
        // recipient might succeed once configuration is fixed mid-run in
        // a real deployment, though that's an edge case; the main reason
        // is simply not letting one bad row kill an otherwise-working push batch).
        failed++;
        this.logger.warn(`Campaign ${campaign.id} dispatch failed for user ${userId}: ${(err as Error).message}`);
      }
    }

    await this.campaignsService.markStatus(campaign.id, failed === userIds.length && userIds.length > 0 ? 'failed' : 'completed', sent);
  }
}
