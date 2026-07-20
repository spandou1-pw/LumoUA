import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type PushPlatform = 'ios' | 'android' | 'web';

@Entity('device_push_tokens')
@Unique(['userId', 'deviceId'])
export class DevicePushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ type: 'varchar' })
  platform: PushPlatform;

  /** Expo push token (wraps APNs/FCM, doc 25) or a Web Push subscription JSON string. */
  @Column({ name: 'push_token', type: 'text' })
  pushToken: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
