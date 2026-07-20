import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('performance_metrics')
@Index(['metricName', 'platform', 'createdAt'])
export class PerformanceMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar' })
  platform: 'ios' | 'android' | 'web' | 'desktop';

  /** e.g. 'cold_start', 'feed_load', 'screen_transition' — matches doc 05/46's named NFR targets. */
  @Column({ name: 'metric_name' })
  metricName: string;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
