import { CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('follows')
@Index(['followeeId']) // fan-out-on-read feed query (doc 27)
export class Follow {
  @PrimaryColumn({ name: 'follower_id', type: 'uuid' })
  followerId: string;

  @PrimaryColumn({ name: 'followee_id', type: 'uuid' })
  followeeId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
