import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedEvent, FeedEventType } from './entities/feed-event.entity';

export interface RankablePost {
  id: string;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
}

const RECENCY_HALF_LIFE_HOURS = 18; // score halves roughly every 18h of age — tunable, not derived from data yet (no data exists)
const LIKE_WEIGHT = 1.0;
const COMMENT_WEIGHT = 2.5; // doc 28: a comment is a stronger positive signal than a like — more effort, more intent

/**
 * doc 28: "Recommended feed... starting point: gradient-boosted trees on
 * engineered features... before reaching for deep learning." This
 * service IS that starting point in its most honest form — a hand-tuned
 * scoring function using the same *shape* of features a GBT model would
 * eventually use (recency, engagement counts), before there's enough
 * logged `FeedEvent` data to actually train anything. It explicitly does
 * NOT replace doc 27's reverse-chronological Following/Global feeds —
 * this is groundwork for the future Recommended feed tab (doc 27 "Phase
 * 3"), not wired into the default feed endpoints in this stage.
 */
@Injectable()
export class FeedRankingService {
  constructor(@InjectRepository(FeedEvent) private readonly events: Repository<FeedEvent>) {}

  static score(post: RankablePost, now: Date = new Date()): number {
    const ageHours = Math.max(0, (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60));
    const recencyDecay = Math.exp((-Math.LN2 * ageHours) / RECENCY_HALF_LIFE_HOURS);
    const engagementScore = Math.log1p(post.likeCount) * LIKE_WEIGHT + Math.log1p(post.commentCount) * COMMENT_WEIGHT;
    return engagementScore * recencyDecay;
  }

  static rank(posts: RankablePost[], now: Date = new Date()): RankablePost[] {
    return [...posts].sort((a, b) => this.score(b, now) - this.score(a, now));
  }

  async logEvent(
    userId: string,
    postId: string,
    eventType: FeedEventType,
    context?: { position?: number; feedType?: 'following' | 'global' },
  ): Promise<void> {
    await this.events.insert({
      userId,
      postId,
      eventType,
      position: context?.position ?? null,
      feedType: context?.feedType ?? null,
    });
  }

  /** doc 28: negative-signal rate is the concrete anti-engagement-maximization check — a future ranking model's objective must weigh this, not just positive engagement. */
  async negativeSignalRate(postId: string): Promise<{ impressions: number; negativeSignals: number; rate: number }> {
    const [impressions, negativeSignals] = await Promise.all([
      this.events.count({ where: { postId, eventType: 'impression' } }),
      this.events
        .createQueryBuilder('e')
        .where('e.post_id = :postId', { postId })
        .andWhere('e.event_type IN (:...types)', { types: ['hide', 'not_interested'] })
        .getCount(),
    ]);
    return { impressions, negativeSignals, rate: impressions > 0 ? negativeSignals / impressions : 0 };
  }
}
