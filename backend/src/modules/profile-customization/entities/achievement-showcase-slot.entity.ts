import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('achievement_showcase_slots')
export class AchievementShowcaseSlot {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ type: 'smallint' })
  position: number;

  @Column({ name: 'achievement_id', type: 'uuid' })
  achievementId: string;
}
