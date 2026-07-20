import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationRecord, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { DevicePushToken, PushPlatform } from './entities/device-token.entity';

const TYPE_TO_PREFERENCE_FIELD: Record<NotificationType, keyof NotificationPreference> = {
  new_message: 'messagesEnabled',
  new_follower: 'socialEngagementEnabled',
  new_comment: 'socialEngagementEnabled',
  new_like: 'socialEngagementEnabled',
  friend_request: 'friendRequestsEnabled',
  friend_request_accepted: 'friendRequestsEnabled',
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationRecord) private readonly notifications: Repository<NotificationRecord>,
    @InjectRepository(NotificationPreference)
    private readonly preferences: Repository<NotificationPreference>,
    @InjectRepository(DevicePushToken) private readonly deviceTokens: Repository<DevicePushToken>,
    @InjectQueue('notification-dispatch') private readonly dispatchQueue: Queue,
  ) {}

  /**
   * doc 25: called by domain events (comment created, followed, etc.) —
   * never sits inline in the write path that triggered it. Checks
   * per-type preference before writing/dispatching anything.
   */
  async notify(
    recipientId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
    pushTitle: string,
    pushBody: string,
  ): Promise<void> {
    const pref = await this.preferences.findOne({ where: { userId: recipientId } });
    const field = TYPE_TO_PREFERENCE_FIELD[type];
    const enabled = pref ? pref[field] : true; // default true if no row (doc 25)
    if (!enabled) return;

    const record = await this.notifications.save(
      this.notifications.create({ recipientId, type, payload }),
    );

    // doc 25: message notifications carry sender name only, never content —
    // enforced by the caller constructing pushBody, but double-checked here
    // for the one type where a content leak would be most damaging.
    if (type === 'new_message' && pushBody.length > 120) {
      pushBody = 'Нове повідомлення';
    }

    await this.dispatchQueue.add(
      'dispatch-push',
      { notificationId: record.id, recipientId, title: pushTitle, body: pushBody, data: payload },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    );
  }

  async listForUser(userId: string, cursor?: string, limit = 30): Promise<NotificationRecord[]> {
    const qb = this.notifications
      .createQueryBuilder('n')
      .where('n.recipient_id = :userId', { userId })
      .orderBy('n.created_at', 'DESC')
      .limit(limit);
    if (cursor) qb.andWhere('n.created_at < :cursor', { cursor: new Date(cursor) });
    return qb.getMany();
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.notifications.update({ id: notificationId, recipientId: userId }, { readAt: new Date() });
  }

  async registerDeviceToken(
    userId: string,
    deviceId: string,
    platform: PushPlatform,
    pushToken: string,
  ): Promise<void> {
    await this.deviceTokens.upsert(
      { userId, deviceId, platform, pushToken, isActive: true },
      ['userId', 'deviceId'],
    );
  }

  async updatePreferences(
    userId: string,
    updates: Partial<Omit<NotificationPreference, 'userId'>>,
  ): Promise<NotificationPreference> {
    let pref = await this.preferences.findOne({ where: { userId } });
    if (!pref) pref = this.preferences.create({ userId });
    Object.assign(pref, updates);
    return this.preferences.save(pref);
  }

  async getActiveTokensForUser(userId: string): Promise<DevicePushToken[]> {
    return this.deviceTokens.find({ where: { userId, isActive: true } });
  }

  async deactivateToken(tokenId: string): Promise<void> {
    await this.deviceTokens.update({ id: tokenId }, { isActive: false });
  }
}
