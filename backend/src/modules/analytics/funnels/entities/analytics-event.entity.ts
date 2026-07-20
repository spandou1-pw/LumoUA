import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * doc GROWTH.md "Funnels": a generic event log distinct from Stage 14's
 * `FeedEvent` (which is feed-ranking-specific) — funnels need arbitrary
 * named steps across the whole app (e.g. 'signup_started' ->
 * 'email_verified' -> 'first_post_created' -> 'premium_purchased'), not
 * just feed interactions.
 */
@Entity('analytics_events')
@Index(['userId', 'eventName', 'createdAt'])
@Index(['eventName', 'createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'event_name' })
  eventName: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
