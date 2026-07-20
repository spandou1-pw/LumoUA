import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * doc 24: community roles are scoped to their community, a distinct
 * dimension from platform roles (PlatformRole). A community 'moderator'
 * here has zero platform-level power — cannot affect a user's standing
 * outside this specific community (doc 32).
 */
export type CommunityMemberRole = 'member' | 'moderator' | 'owner';

@Entity('community_members')
export class CommunityMember {
  @PrimaryColumn({ name: 'community_id', type: 'uuid' })
  communityId: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', default: 'member' })
  role: CommunityMemberRole;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;
}
