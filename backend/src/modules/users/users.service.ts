import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Follow } from './entities/follow.entity';
import { Block } from './entities/block.entity';
import { Mute } from './entities/mute.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PolicyService } from './policy.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(Block) private readonly blocks: Repository<Block>,
    @InjectRepository(Mute) private readonly mutes: Repository<Mute>,
    @InjectRepository(FriendRequest) private readonly friendRequests: Repository<FriendRequest>,
    private readonly policy: PolicyService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.users.findOne({ where: { username } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  /** doc 22 GET /users/:username — respects blocking/privacy (doc 24). */
  async getPublicProfile(viewerId: string, username: string) {
    const owner = await this.findByUsername(username);
    if (await this.policy.isBlockedEitherWay(viewerId, owner.id)) {
      throw new NotFoundException('USER_NOT_FOUND'); // 404, not 403 — don't reveal block state
    }
    const canView = await this.policy.canViewProfileContent(viewerId, owner.id);
    const [followerCount, followingCount] = await Promise.all([
      this.follows.count({ where: { followeeId: owner.id } }),
      this.follows.count({ where: { followerId: owner.id } }),
    ]);
    return {
      id: owner.id,
      username: owner.username,
      displayName: owner.displayName,
      avatarUrl: owner.avatarUrl,
      coverUrl: owner.coverUrl,
      bio: owner.bio,
      isVerified: owner.isVerified,
      isPrivate: owner.isPrivate,
      followerCount,
      followingCount,
      contentVisible: canView, // client hides posts list if false — but server also re-checks on the posts endpoint itself
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    Object.assign(user, dto);
    return this.users.save(user);
  }

  // ---------- Social graph (doc 04 GRAPH-1..4) ----------

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) throw new BadRequestException('CANNOT_FOLLOW_SELF');
    if (await this.policy.isBlockedEitherWay(followerId, followeeId)) {
      throw new ForbiddenException('BLOCKED');
    }
    const existing = await this.follows.exist({ where: { followerId, followeeId } });
    if (existing) return; // idempotent
    await this.follows.insert({ followerId, followeeId });
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    await this.follows.delete({ followerId, followeeId });
  }

  async block(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) throw new BadRequestException('CANNOT_BLOCK_SELF');
    await this.blocks.upsert({ blockerId, blockedId }, ['blockerId', 'blockedId']);
    // Blocking implicitly severs the follow graph both directions (doc 24).
    await this.follows.delete({ followerId: blockerId, followeeId: blockedId });
    await this.follows.delete({ followerId: blockedId, followeeId: blockerId });
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.blocks.delete({ blockerId, blockedId });
  }

  async mute(muterId: string, mutedId: string): Promise<void> {
    if (muterId === mutedId) throw new BadRequestException('CANNOT_MUTE_SELF');
    await this.mutes.upsert({ muterId, mutedId }, ['muterId', 'mutedId']);
  }

  async unmute(muterId: string, mutedId: string): Promise<void> {
    await this.mutes.delete({ muterId, mutedId });
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<FriendRequest> {
    if (requesterId === addresseeId) throw new BadRequestException('CANNOT_FRIEND_SELF');
    if (await this.policy.isBlockedEitherWay(requesterId, addresseeId)) {
      throw new ForbiddenException('BLOCKED');
    }
    const existing = await this.friendRequests.findOne({
      where: { requesterId, addresseeId },
    });
    if (existing) throw new ConflictException('FRIEND_REQUEST_ALREADY_EXISTS');
    return this.friendRequests.save(
      this.friendRequests.create({ requesterId, addresseeId, status: 'pending' }),
    );
  }

  async respondToFriendRequest(
    requestId: string,
    responderId: string,
    accept: boolean,
  ): Promise<FriendRequest> {
    const request = await this.friendRequests.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('FRIEND_REQUEST_NOT_FOUND');
    if (request.addresseeId !== responderId) throw new ForbiddenException('NOT_YOUR_REQUEST');
    request.status = accept ? 'accepted' : 'declined';
    return this.friendRequests.save(request);
  }
}
