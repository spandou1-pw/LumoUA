import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ExperimentEventType = 'exposure' | 'conversion';

@Entity('experiment_events')
@Index(['experimentKey', 'variantKey', 'eventType'])
export class ExperimentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'experiment_key', type: 'citext' })
  experimentKey: string;

  @Column({ name: 'variant_key' })
  variantKey: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: ExperimentEventType;

  /** doc GROWTH.md: what "conversion" means for this experiment (e.g. 'premium_purchase', 'gift_sent') — a free-text label, not a fixed enum, since experiments target arbitrary goals. */
  @Column({ name: 'conversion_goal', nullable: true })
  conversionGoal: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
