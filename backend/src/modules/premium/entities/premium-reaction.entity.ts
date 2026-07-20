import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export type ReactionTargetType = 'post' | 'comment' | 'message';

/**
 * doc 04 POST-6/MSG-6 ("reactions beyond like") + doc 15 UI Kit's
 * reaction-pop component: this coexists with the basic `likes` table
 * (Stage 5) rather than replacing it — a like is the free, zero-friction
 * default interaction; an emoji reaction is a premium expressive upgrade.
 * A user can have both a like and an emoji reaction on the same target.
 */
@Entity('premium_reactions')
@Index(['targetType', 'targetId'])
export class PremiumReaction {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'target_type', type: 'varchar' })
  targetType: ReactionTargetType;

  @PrimaryColumn({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar' })
  emoji: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
