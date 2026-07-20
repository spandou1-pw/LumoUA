import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { Follow } from '../../users/entities/follow.entity';
import { GiftTransaction } from '../../gifts/entities/gift-transaction.entity';
import { Like } from '../../reactions/entities/like.entity';

/**
 * doc GROWTH.md "Creator Dashboard" / "Creator Monetization": this is
 * READ-ONLY visibility for a user into their own growth and the notional
 * coin-value of gifts they've received — it does NOT add any payout
 * capability. The Stage 6/8 boundary is unchanged: received-gift coin
 * value shown here is the same non-redeemable notional figure from
 * `gift_received_notional` ledger entries, never spendable, never
 * cashable. If "Creator Monetization" is meant to include actual payouts
 * to creators, that remains the flagged, not-built Stripe Connect feature
 * from PAYMENTS.md — this dashboard is the visibility layer that would
 * sit in front of such a feature, not the feature itself.
 */
@Injectable()
export class CreatorDashboardService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(GiftTransaction) private readonly giftTransactions: Repository<GiftTransaction>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
  ) {}

  async overview(userId: string, sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    const [postCount, newFollowers, totalFollowers, giftsReceived, recentPosts] = await Promise.all([
      this.posts.count({ where: { authorId: userId, createdAt: MoreThan(since) } }),
      this.follows.count({ where: { followeeId: userId, createdAt: MoreThan(since) } }),
      this.follows.count({ where: { followeeId: userId } }),
      this.giftTransactions.find({ where: { recipientId: userId, createdAt: MoreThan(since) } }),
      this.posts.find({ where: { authorId: userId, createdAt: MoreThan(since) }, select: ['id'] }),
    ]);

    const postIds = recentPosts.map((p) => p.id);
    const likeCount = postIds.length
      ? await this.likes.count({ where: { targetType: 'post', targetId: In(postIds) } })
      : 0;

    const notionalGiftCoinValue = giftsReceived.reduce((sum, g) => sum + BigInt(g.coinCost), 0n);

    return {
      periodDays: sinceDays,
      content: { postsCreated: postCount, likesReceived: likeCount },
      audience: { newFollowers, totalFollowers },
      gifts: {
        received: giftsReceived.length,
        notionalCoinValue: notionalGiftCoinValue.toString(),
        note: 'Notional value only — not spendable or withdrawable coins. See GROWTH.md.',
      },
    };
  }
}
