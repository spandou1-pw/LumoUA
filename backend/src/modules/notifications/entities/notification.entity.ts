import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationType =
  | 'new_message'
  | 'new_follower'
  | 'new_comment'
  | 'new_like'
  | 'friend_request'
  | 'friend_request_accepted';

@Entity('notifications')
@Index(['recipientId', 'createdAt'])
export class NotificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ type: 'varchar' })
  type: NotificationType;

  /** doc 25: minimal contextual data only — never message content for new_message. */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
