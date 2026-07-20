import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('bookmarks')
export class Bookmark {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  postId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
