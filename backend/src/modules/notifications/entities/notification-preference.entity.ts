import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * doc 25: per-type toggle, not a single global on/off. One row per user;
 * missing row = all defaults (true) via the service-layer fallback.
 */
@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'messages_enabled', default: true })
  messagesEnabled: boolean;

  @Column({ name: 'social_engagement_enabled', default: true })
  socialEngagementEnabled: boolean;

  @Column({ name: 'friend_requests_enabled', default: true })
  friendRequestsEnabled: boolean;
}
