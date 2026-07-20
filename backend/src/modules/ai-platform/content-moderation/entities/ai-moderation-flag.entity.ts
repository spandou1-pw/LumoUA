import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ModerationTargetType = 'post' | 'comment' | 'image' | 'video';
export type ModerationCategory =
  | 'spam'
  | 'hate_speech'
  | 'harassment'
  | 'graphic_violence'
  | 'nsfw'
  | 'self_harm'
  | 'illegal_content'
  | 'other';
export type FlagOutcome = 'pending_review' | 'confirmed' | 'false_positive';

/**
 * doc 33: an AI classification is a confidence-scored FLAG, never a
 * removal action. This table exists specifically so the false-positive/
 * confirmed outcome of every flag is recorded (doc 33's "feedback loop...
 * the mechanism for measuring and improving classifier precision over
 * time") — `outcome` starts 'pending_review' and is set by whichever
 * human moderator resolves the Report this flag creates.
 */
@Entity('ai_moderation_flags')
@Index(['targetType', 'targetId'])
export class AiModerationFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'target_type', type: 'varchar' })
  targetType: ModerationTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar' })
  category: ModerationCategory;

  /** 0-100 — doc 32 severity-first queue ordering uses this alongside report reason. */
  @Column({ type: 'smallint' })
  confidence: number;

  @Column({ name: 'provider', type: 'varchar' })
  provider: string; // e.g. 'perspective-api', 'stub', 'self-harm-keyword-filter'

  /** doc 32: links to the Report this flag generated, so resolution feeds back here (see outcome). */
  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId: string | null;

  @Column({ type: 'varchar', default: 'pending_review' })
  outcome: FlagOutcome;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
