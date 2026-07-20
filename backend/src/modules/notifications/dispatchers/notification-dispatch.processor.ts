import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from '../notifications.service';
import { PushDispatcher } from './push.dispatcher';

interface DispatchJobData {
  notificationId: string;
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Processor('notification-dispatch')
export class NotificationDispatchProcessor {
  private readonly logger = new Logger(NotificationDispatchProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushDispatcher: PushDispatcher,
  ) {}

  @Process('dispatch-push')
  async handle(job: Job<DispatchJobData>): Promise<void> {
    const { recipientId, title, body, data } = job.data;
    const tokens = await this.notificationsService.getActiveTokensForUser(recipientId);

    await Promise.all(
      tokens.map(async (token) => {
        const result = await this.pushDispatcher.send(token, { title, body, data });
        if (result.staleToken) {
          // doc 25: expired/invalid token marked inactive rather than
          // retried indefinitely.
          await this.notificationsService.deactivateToken(token.id);
          this.logger.log(`Deactivated stale push token for device ${token.deviceId}`);
        } else if (!result.delivered) {
          this.logger.warn(`Push dispatch failed for device ${token.deviceId}`);
        }
      }),
    );
  }
}
