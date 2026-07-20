import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_mission_progress')
export class UserMissionProgress {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'mission_definition_id', type: 'uuid' })
  missionDefinitionId: string;

  /** doc GROWTH.md: e.g. '2026-07-18' for a daily mission, '2026-W29' for weekly — computed by `MissionPeriodCalculator`, never a raw timestamp, so progress resets cleanly at period boundaries. */
  @PrimaryColumn({ name: 'period_key' })
  periodKey: string;

  @Column({ name: 'progress_count', type: 'int', default: 0 })
  progressCount: number;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'rewarded_at', type: 'timestamptz', nullable: true })
  rewardedAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
