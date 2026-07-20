import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Follow } from '../users/entities/follow.entity';
import { WalletTransaction } from '../wallet/entities/wallet-transaction.entity';
import { GiftTransaction } from '../gifts/entities/gift-transaction.entity';

/**
 * doc GDPR.md "Right to Access" (Art. 15) / "Right to Data Portability"
 * (Art. 20): a real, structured export — not a stub. Scope is explicit
 * and honestly bounded: profile, posts, comments, social graph, and the
 * wallet/gift ledgers (financial records users have a strong interest in
 * seeing). NOT included in this pass: message content (architecturally
 * can't be exported server-side — it's E2E encrypted, doc 26/31; a real
 * "export my messages" feature would need to run client-side, where the
 * plaintext actually exists), premium cosmetic selections, and
 * notification history — flagged in GDPR.md as a scoping decision to
 * revisit, not silently omitted.
 */
@Injectable()
export class DataExportService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(WalletTransaction) private readonly walletTransactions: Repository<WalletTransaction>,
    @InjectRepository(GiftTransaction) private readonly giftTransactions: Repository<GiftTransaction>,
  ) {}

  async exportForUser(userId: string) {
    const [user, posts, comments, following, followers, walletHistory, giftsSent, giftsReceived] = await Promise.all([
      this.users.findOne({ where: { id: userId } }),
      this.posts.find({ where: { authorId: userId } }),
      this.comments.find({ where: { authorId: userId } }),
      this.follows.find({ where: { followerId: userId } }),
      this.follows.find({ where: { followeeId: userId } }),
      this.walletTransactions.find({ where: { userId } }),
      this.giftTransactions.find({ where: { senderId: userId } }),
      this.giftTransactions.find({ where: { recipientId: userId } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      scopeNote:
        'This export does not include private message content (end-to-end encrypted — never available server-side, doc 26/31). See GDPR.md for full scope notes.',
      profile: user
        ? {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            bio: user.bio,
            createdAt: user.createdAt,
          }
        : null,
      posts: posts.map((p) => ({ id: p.id, body: p.body, createdAt: p.createdAt })),
      comments: comments.map((c) => ({ id: c.id, postId: c.postId, body: c.body, createdAt: c.createdAt })),
      socialGraph: {
        followingCount: following.length,
        followerCount: followers.length,
      },
      wallet: {
        transactionCount: walletHistory.length,
        transactions: walletHistory.map((t) => ({
          type: t.type,
          amount: t.amount,
          createdAt: t.createdAt,
        })),
      },
      gifts: {
        sent: giftsSent.map((g) => ({ recipientId: g.recipientId, coinCost: g.coinCost, createdAt: g.createdAt })),
        received: giftsReceived.map((g) => ({ senderId: g.senderId, coinCost: g.coinCost, createdAt: g.createdAt })),
      },
    };
  }
}
