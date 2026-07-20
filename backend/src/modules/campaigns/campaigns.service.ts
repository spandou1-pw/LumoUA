import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Campaign, CampaignSegment } from './entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

/**
 * doc GROWTH.md "Push Campaigns"/"Email Campaigns": segments are real SQL
 * predicates evaluated at send time — not a precomputed, potentially-
 * stale user list captured at campaign-creation time. `inactive_7d` reuses
 * Stage 15's `refresh_tokens.last_used_at` (the same real activity signal
 * `RetentionAnalyticsService` uses), and `non_premium`/`premium` reuse the
 * `Subscription` table Stage 6 already maintains — no new activity-
 * tracking mechanism invented for this feature.
 */
@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign) private readonly campaigns: Repository<Campaign>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
    @InjectQueue('campaign-dispatch') private readonly dispatchQueue: Queue,
  ) {}

  async create(actorId: string, dto: Pick<Campaign, 'channel' | 'segment' | 'title' | 'body'>): Promise<Campaign> {
    const campaign = await this.campaigns.save(this.campaigns.create({ ...dto, createdBy: actorId, status: 'pending' }));
    await this.dispatchQueue.add('dispatch', { campaignId: campaign.id });
    this.logger.log(`Campaign ${campaign.id} (${dto.channel}/${dto.segment}) enqueued`);
    return campaign;
  }

  async resolveSegmentUserIds(segment: CampaignSegment): Promise<string[]> {
    const qb = this.users.createQueryBuilder('u').select('u.id', 'id').where("u.status = 'active'");

    switch (segment) {
      case 'all_active':
        break;
      case 'inactive_7d':
      case 'inactive_30d': {
        const days = segment === 'inactive_7d' ? 7 : 30;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        qb.leftJoin('refresh_tokens', 'rt', 'rt.user_id = u.id')
          .groupBy('u.id')
          .having('MAX(rt.last_used_at) < :cutoff OR MAX(rt.last_used_at) IS NULL', { cutoff });
        break;
      }
      case 'premium': {
        const activeUserIds = await this.subscriptions
          .createQueryBuilder('s')
          .select('DISTINCT s.user_id', 'id')
          .where('s.status IN (:...statuses)', { statuses: ['active', 'grace_period'] })
          .getRawMany<{ id: string }>();
        return activeUserIds.map((r) => r.id);
      }
      case 'non_premium': {
        const premiumIds = await this.resolveSegmentUserIds('premium');
        const all = await qb.getRawMany<{ id: string }>();
        const premiumSet = new Set(premiumIds);
        return all.map((r) => r.id).filter((id) => !premiumSet.has(id));
      }
    }

    const rows = await qb.getRawMany<{ id: string }>();
    return rows.map((r) => r.id);
  }

  async markStatus(id: string, status: Campaign['status'], recipientCount?: number): Promise<void> {
    await this.campaigns.update(
      { id },
      { status, recipientCount: recipientCount ?? undefined, completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined },
    );
  }

  async listRecent(limit = 20): Promise<Campaign[]> {
    return this.campaigns.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
