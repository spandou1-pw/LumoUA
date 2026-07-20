import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember, CommunityMemberRole } from './entities/community-member.entity';
import { CreateCommunityDto, UpdateCommunityDto } from './dto/community.dto';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community) private readonly communities: Repository<Community>,
    @InjectRepository(CommunityMember) private readonly members: Repository<CommunityMember>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  async create(creatorId: string, dto: CreateCommunityDto): Promise<Community> {
    const slugTaken = await this.communities.exist({ where: { slug: dto.slug } });
    if (slugTaken) throw new ConflictException('SLUG_ALREADY_TAKEN');

    const community = await this.communities.save(
      this.communities.create({ ...dto, createdBy: creatorId }),
    );
    // Creator is automatically the owner (doc 24 scoped-role extension point).
    await this.members.insert({ communityId: community.id, userId: creatorId, role: 'owner' });
    return community;
  }

  async getBySlug(slug: string): Promise<Community> {
    const community = await this.communities.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('COMMUNITY_NOT_FOUND');
    return community;
  }

  async getMemberRole(communityId: string, userId: string): Promise<CommunityMemberRole | null> {
    const membership = await this.members.findOne({ where: { communityId, userId } });
    return membership?.role ?? null;
  }

  private async requireRole(
    communityId: string,
    userId: string,
    allowed: CommunityMemberRole[],
  ): Promise<void> {
    const role = await this.getMemberRole(communityId, userId);
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException('INSUFFICIENT_COMMUNITY_ROLE');
    }
  }

  async update(communityId: string, actorId: string, dto: UpdateCommunityDto): Promise<Community> {
    // doc 24: community moderator/owner, not platform role, governs this.
    await this.requireRole(communityId, actorId, ['owner', 'moderator']);
    const community = await this.communities.findOne({ where: { id: communityId } });
    if (!community) throw new NotFoundException('COMMUNITY_NOT_FOUND');
    Object.assign(community, dto);
    return this.communities.save(community);
  }

  async join(communityId: string, userId: string): Promise<void> {
    const community = await this.communities.findOne({ where: { id: communityId } });
    if (!community) throw new NotFoundException('COMMUNITY_NOT_FOUND');

    if (community.visibility === 'private') {
      // Phase 2 scope note (doc 03): private-community join requests/invites
      // are a distinct flow, not modeled in this Phase-1-shaped stub — direct
      // join is intentionally rejected here rather than silently allowed.
      throw new ForbiddenException('PRIVATE_COMMUNITY_REQUIRES_INVITE');
    }

    const existing = await this.members.exist({ where: { communityId, userId } });
    if (existing) return;
    await this.members.insert({ communityId, userId, role: 'member' });
  }

  async leave(communityId: string, userId: string): Promise<void> {
    const membership = await this.members.findOne({ where: { communityId, userId } });
    if (membership?.role === 'owner') {
      throw new ForbiddenException('OWNER_CANNOT_LEAVE_MUST_TRANSFER_OR_DELETE');
    }
    await this.members.delete({ communityId, userId });
  }

  async listMembers(communityId: string) {
    return this.members.find({ where: { communityId } });
  }

  /**
   * doc 32: community moderators can manage membership within their
   * community only — this never touches the user's platform-wide standing.
   */
  async removeMember(communityId: string, actorId: string, targetUserId: string): Promise<void> {
    await this.requireRole(communityId, actorId, ['owner', 'moderator']);
    const target = await this.members.findOne({ where: { communityId, userId: targetUserId } });
    if (target?.role === 'owner') {
      throw new ForbiddenException('CANNOT_REMOVE_OWNER');
    }
    await this.members.delete({ communityId, userId: targetUserId });

    await this.auditLog.insert({
      actorId,
      action: 'COMMUNITY_MEMBER_REMOVED',
      targetType: 'community_member',
      targetId: targetUserId,
      metadata: { communityId },
    });
  }

  async assignCommunityRole(
    communityId: string,
    actorId: string,
    targetUserId: string,
    role: CommunityMemberRole,
  ): Promise<void> {
    await this.requireRole(communityId, actorId, ['owner']); // only owner promotes/demotes moderators
    const membership = await this.members.findOne({ where: { communityId, userId: targetUserId } });
    if (!membership) throw new NotFoundException('NOT_A_MEMBER');
    membership.role = role;
    await this.members.save(membership);
  }
}
