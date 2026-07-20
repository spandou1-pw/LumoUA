import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { MessageCreatedEvent } from './messages.service';

/**
 * doc 25: notification dispatch is triggered by domain events, not called
 * inline from the write path. doc 25's content-policy rule is enforced
 * here at the source — the push body is always the fixed, generic string,
 * never derived from message content, since content is E2E ciphertext the
 * server cannot and must not attempt to summarize.
 *
 * Production refinement (doc 25 Phase 3 note): skip push entirely for a
 * recipient whose socket is currently connected to this conversation's
 * room (foreground suppression) — omitted here as it requires querying
 * the gateway's live room membership, which is a reasonable next increment.
 */
@Injectable()
export class MessageNotificationListener {
  constructor(
    private readonly notifications: NotificationsService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @OnEvent('message.created')
  async handleMessageCreated(event: MessageCreatedEvent): Promise<void> {
    const sender = await this.users.findOne({ where: { id: event.senderId } });
    if (!sender) return;

    await Promise.all(
      event.recipientIds.map((recipientId) =>
        this.notifications.notify(
          recipientId,
          'new_message',
          { conversationId: event.message.conversationId, senderId: event.senderId },
          sender.displayName,
          'Нове повідомлення', // doc 25: never message content in the push body
        ),
      ),
    );
  }
}
