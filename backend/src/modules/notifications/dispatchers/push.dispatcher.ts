import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevicePushToken } from '../entities/device-token.entity';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * doc 25: iOS/Android both go through Expo's push service so the client
 * doesn't need direct APNs certificate management in Phase 1. Web uses the
 * Web Push API separately (doc 19) — not handled by this dispatcher.
 */
@Injectable()
export class PushDispatcher {
  private readonly logger = new Logger(PushDispatcher.name);
  private readonly expoAccessToken: string;

  constructor(private readonly config: ConfigService) {
    this.expoAccessToken = this.config.get<string>('EXPO_PUSH_ACCESS_TOKEN') ?? '';
  }

  async send(token: DevicePushToken, message: PushMessage): Promise<{ delivered: boolean; staleToken: boolean }> {
    if (token.platform === 'web') {
      return this.sendWebPush(token, message);
    }
    return this.sendExpoPush(token, message);
  }

  private async sendExpoPush(
    token: DevicePushToken,
    message: PushMessage,
  ): Promise<{ delivered: boolean; staleToken: boolean }> {
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.expoAccessToken}`,
        },
        body: JSON.stringify({
          to: token.pushToken,
          title: message.title,
          body: message.body,
          data: message.data ?? {},
        }),
      });
      const json = (await res.json()) as { data?: { status?: string; details?: { error?: string } } };
      const status = json.data?.status;
      const staleToken = json.data?.details?.error === 'DeviceNotRegistered';
      return { delivered: status === 'ok', staleToken };
    } catch (err) {
      this.logger.error(`Expo push failed for device ${token.deviceId}`, err as Error);
      return { delivered: false, staleToken: false };
    }
  }

  private async sendWebPush(
    _token: DevicePushToken,
    _message: PushMessage,
  ): Promise<{ delivered: boolean; staleToken: boolean }> {
    // TODO: web-push library with VAPID keys (doc 19/25). Stubbed for now.
    this.logger.warn('Web Push dispatch not yet implemented');
    return { delivered: false, staleToken: false };
  }
}
