import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * doc GROWTH.md "Crash Analytics": a real ingestion endpoint + aggregation
 * — what's honestly NOT built is the client-side crash-capture SDK
 * integration (e.g. Sentry) in the mobile (Stage 11) or web (Stage 12)
 * apps, which would be what actually calls this endpoint automatically on
 * a real crash. This is the backend half of the feature, ready for that
 * client integration.
 */
@Entity('crash_reports')
@Index(['platform', 'appVersion', 'createdAt'])
export class CrashReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar' })
  platform: 'ios' | 'android' | 'web' | 'desktop';

  @Column({ name: 'app_version' })
  appVersion: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  stackTrace: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
