import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ReportTargetType = 'post' | 'comment' | 'user' | 'message' | 'community' | 'gift';
export type ReportStatus = 'open' | 'dismissed' | 'actioned';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'illegal_content'
  | 'impersonation'
  | 'self_harm'
  | 'other';

/**
 * doc 32: structured reason categories (not free-text-only) so moderation
 * triage is tractable. `targetType` includes 'message' for completeness of
 * the reporting surface — doc 26/31's E2E encryption means a reported
 * message's *content* is never visible to a moderator (see doc ADMIN.md
 * "Messenger" section); a message report can only ever be resolved by
 * looking at metadata (who/when/how often) or by the reporter's own
 * decrypted screenshot/description in `detail`, never by the platform
 * decrypting the message itself.
 */
@Entity('reports')
@Index(['status', 'createdAt'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Null for AI-filed reports (see `filedByAi`) — reporter_id is a real FK to users(id), so an AI-filed report cannot use a sentinel string here. */
  @Column({ name: 'reporter_id', type: 'uuid', nullable: true })
  reporterId: string | null;

  @Column({ name: 'filed_by_ai', default: false })
  filedByAi: boolean;

  @Column({ name: 'target_type', type: 'varchar' })
  targetType: ReportTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar' })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Column({ type: 'varchar', default: 'open' })
  status: ReportStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;
}
