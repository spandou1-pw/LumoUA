import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'achievement_id', type: 'uuid' })
  achievementId: string;

  @CreateDateColumn({ name: 'earned_at', type: 'timestamptz' })
  earnedAt: Date;
}
