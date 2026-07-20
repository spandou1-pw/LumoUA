import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type FeedEventType = 'impression' | 'like' | 'comment' | 'bookmark' | 'hide' | 'not_interested';

/**
 * doc 28 "Phase 1-2 Groundwork": "log the events a future recommendation
 * model will need, since event data can't be retroactively generated" —
 * this table is exactly that, built now rather than deferred. Negative
 * signals (`hide`/`not_interested`) are first-class event types, not an
 * afterthought — doc 28's explicit anti-engagement-maximization
 * requirement depends on having these as real training examples, not
 * just positive engagement.
 */
@Entity('feed_events')
@Index(['userId', 'createdAt'])
@Index(['postId'])
export class FeedEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: FeedEventType;

  /** Position in the feed at impression time — useful for future position-bias correction in ranking models. */
  @Column({ type: 'smallint', nullable: true })
  position: number | null;

  @Column({ name: 'feed_type', type: 'varchar', nullable: true })
  feedType: 'following' | 'global' | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
