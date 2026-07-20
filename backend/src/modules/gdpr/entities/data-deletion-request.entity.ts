import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type DeletionRequestStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * doc GDPR.md: account deletion touches every domain module (posts,
 * comments, messages, wallet, gifts, media...) — this record tracks the
 * request itself so its progress/completion is auditable, distinct from
 * the deletion work each module actually performs. doc 45's backup-
 * retention-vs-erasure tension (backups may retain data for the backup
 * retention window even after live-data erasure completes) applies here
 * exactly as documented there — this table records live-data erasure,
 * not backup purging, which follows its own retention schedule.
 */
@Entity('data_deletion_requests')
export class DataDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: DeletionRequestStatus;

  @CreateDateColumn({ name: 'requested_at', type: 'timestamptz' })
  requestedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;
}
