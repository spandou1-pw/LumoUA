import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true })
  key: string; // stable slug, e.g. 'first_post', 'gifted_100_coins'

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'icon_url' })
  iconUrl: string;

  @Column({ type: 'varchar', default: 'bronze' })
  tier: AchievementTier;

  @Column({ default: true })
  active: boolean;
}
