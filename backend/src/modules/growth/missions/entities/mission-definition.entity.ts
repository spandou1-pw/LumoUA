import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MissionPeriod = 'daily' | 'weekly' | 'seasonal';

@Entity('mission_definitions')
export class MissionDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true })
  key: string; // e.g. 'send_3_gifts', 'post_daily'

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  period: MissionPeriod;

  @Column({ name: 'target_count', type: 'int' })
  targetCount: number;

  @Column({ name: 'reward_coins', type: 'bigint' })
  rewardCoins: string;

  /** doc GIFTS.md precedent: reuses the same season-tag concept as Seasonal Gifts — a mission and a gift can share one season's theme. */
  @Column({ name: 'season_tag', nullable: true })
  seasonTag: string | null;

  @Column({ default: true })
  active: boolean;
}
