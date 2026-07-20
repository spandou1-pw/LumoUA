import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { Follow } from './entities/follow.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { User } from './entities/user.entity';

/**
 * Single source of truth for relationship-dependent authorization checks
 * (doc 24 "Enforcement Pattern" — one shared policy service, not
 * reimplemented per-endpoint). Every method here is server-side and must be
 * called on every relevant read/write, never trusted from client-side state.
 */
@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Block) private readonly blocks: Repository<Block>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(FriendRequest) private readonly friendRequests: Repository<FriendRequest>,
  ) {}

  /** True if either user has blocked the other (blocking is effectively bidirectional in effect). */
  async isBlockedEitherWay(userA: string, userB: string): Promise<boolean> {
    const count = await this.blocks.count({
      where: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    });
    return count > 0;
  }

  private async isAccepted(followerOrRequesterA: string, otherB: string): Promise<boolean> {
    const [isFollowed, isFriend] = await Promise.all([
      this.follows.exist({ where: { followerId: otherB, followeeId: followerOrRequesterA } }),
      this.friendRequests.exist({
        where: [
          { requesterId: followerOrRequesterA, addresseeId: otherB, status: 'accepted' },
          { requesterId: otherB, addresseeId: followerOrRequesterA, status: 'accepted' },
        ],
      }),
    ]);
    return isFollowed || isFriend;
  }

  /**
   * doc 24: viewing a private profile's posts requires the requester be an
   * accepted friend/follower, or be the profile owner. Never trust a client
   * "isFollowing" flag — always recomputed here.
   */
  async canViewProfileContent(viewerId: string, ownerId: string): Promise<boolean> {
    if (viewerId === ownerId) return true;
    if (await this.isBlockedEitherWay(viewerId, ownerId)) return false;

    const owner = await this.users.findOne({ where: { id: ownerId } });
    if (!owner) return false;
    if (!owner.isPrivate) return true;

    return this.isAccepted(viewerId, ownerId);
  }

  /**
   * doc 24: message permission depends on recipient's PROF-2 privacy tier
   * AND absence of a block in either direction. `messagePrivacy` is read
   * from the recipient's settings — modeled here as "everyone" | "followers" | "none"
   * for extensibility beyond the Phase 1 binary.
   */
  async canMessage(
    senderId: string,
    recipientId: string,
    recipientMessagePrivacy: 'everyone' | 'followers' | 'none',
  ): Promise<boolean> {
    if (senderId === recipientId) return false;
    if (await this.isBlockedEitherWay(senderId, recipientId)) return false;
    if (recipientMessagePrivacy === 'none') return false;
    if (recipientMessagePrivacy === 'everyone') return true;
    // 'followers': recipient must follow the sender back, or an accepted friendship exists
    return this.follows.exist({ where: { followerId: recipientId, followeeId: senderId } });
  }

  async isOwner(resourceOwnerId: string, requesterId: string): Promise<boolean> {
    return resourceOwnerId === requesterId;
  }
}
