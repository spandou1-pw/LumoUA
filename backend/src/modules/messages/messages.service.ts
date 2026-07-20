import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { DeviceKey } from './entities/device-key.entity';
import { PolicyService } from '../users/policy.service';
import { PublishDeviceKeysDto, SendMessageDto } from './dto/message.dto';

export interface MessageCreatedEvent {
  message: Message;
  senderId: string;
  recipientIds: string[];
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participants: Repository<ConversationParticipant>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(DeviceKey) private readonly deviceKeys: Repository<DeviceKey>,
    private readonly policy: PolicyService,
    private readonly events: EventEmitter2,
  ) {}

  // ---------- Device keys (doc 26 key setup) ----------

  async publishDeviceKeys(userId: string, dto: PublishDeviceKeysDto): Promise<void> {
    await this.deviceKeys.upsert(
      {
        userId,
        deviceId: dto.deviceId,
        identityKey: Buffer.from(dto.identityKey, 'base64'),
        signedPrekey: Buffer.from(dto.signedPrekey, 'base64'),
        signedPrekeySignature: Buffer.from(dto.signedPrekeySignature, 'base64'),
        oneTimePrekeys: dto.oneTimePrekeys,
      },
      ['userId', 'deviceId'],
    );
  }

  /**
   * doc 22 GET /devices/:userId/keys — fetch a prekey bundle to initiate an
   * X3DH session. Consumes (removes) one one-time prekey from the pool so
   * it's never reused across sessions, per Signal Protocol's design (doc 26).
   */
  async getPrekeyBundle(targetUserId: string) {
    const key = await this.deviceKeys.findOne({ where: { userId: targetUserId } });
    if (!key) throw new NotFoundException('NO_DEVICE_KEYS_PUBLISHED');

    const oneTimePrekey = key.oneTimePrekeys.length > 0 ? key.oneTimePrekeys[0] : null;
    if (oneTimePrekey) {
      key.oneTimePrekeys = key.oneTimePrekeys.slice(1);
      await this.deviceKeys.save(key);
    }

    return {
      deviceId: key.deviceId,
      identityKey: key.identityKey.toString('base64'),
      signedPrekey: key.signedPrekey.toString('base64'),
      signedPrekeySignature: key.signedPrekeySignature.toString('base64'),
      oneTimePrekey, // may be null — client falls back to X3DH without a one-time key
    };
  }

  // ---------- Conversations ----------

  async startDirectConversation(initiatorId: string, recipientId: string): Promise<Conversation> {
    if (initiatorId === recipientId) throw new ForbiddenException('CANNOT_MESSAGE_SELF');

    // doc 24: privacy-tier check happens here, server-side, never trusted
    // from client state alone. Phase 1 default: 'everyone' unless the
    // recipient's PROF-2 setting says otherwise (fetched via UsersService
    // in a real wiring — simplified here to 'everyone' as the Phase 1 default).
    if (await this.policy.isBlockedEitherWay(initiatorId, recipientId)) {
      throw new ForbiddenException('BLOCKED');
    }

    // Reuse an existing direct conversation between these two users if one exists.
    const existing = await this.participants
      .createQueryBuilder('p1')
      .innerJoin(ConversationParticipant, 'p2', 'p1.conversation_id = p2.conversation_id')
      .innerJoin(Conversation, 'c', 'c.id = p1.conversation_id')
      .where('p1.user_id = :a', { a: initiatorId })
      .andWhere('p2.user_id = :b', { b: recipientId })
      .andWhere('c.type = :type', { type: 'direct' })
      .select('c.id', 'id')
      .getRawOne<{ id: string }>();

    if (existing) return this.conversations.findOneOrFail({ where: { id: existing.id } });

    const conversation = await this.conversations.save(this.conversations.create({ type: 'direct' }));
    await this.participants.insert([
      { conversationId: conversation.id, userId: initiatorId, role: 'member' },
      { conversationId: conversation.id, userId: recipientId, role: 'member' },
    ]);
    return conversation;
  }

  async listConversationsForUser(userId: string) {
    // doc 22 GraphQL note: real implementation aggregates last-message
    // preview + unread count in one query via DataLoader-batched resolvers.
    // REST sketch here for the doc's parallel REST endpoint.
    return this.participants
      .createQueryBuilder('p')
      .innerJoin(Conversation, 'c', 'c.id = p.conversation_id')
      .where('p.user_id = :userId', { userId })
      .select(['c.id AS id', 'c.type AS type', 'p.last_read_at AS "lastReadAt"'])
      .getRawMany();
  }

  private async assertParticipant(conversationId: string, userId: string): Promise<void> {
    const isParticipant = await this.participants.exist({ where: { conversationId, userId } });
    if (!isParticipant) throw new ForbiddenException('NOT_A_PARTICIPANT');
  }

  // ---------- Messages ----------

  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    await this.assertParticipant(dto.conversationId, senderId);

    const message = await this.messages.save(
      this.messages.create({
        conversationId: dto.conversationId,
        senderId,
        ciphertext: Buffer.from(dto.ciphertext, 'base64'),
        ciphertextMeta: dto.ciphertextMeta,
      }),
    );

    const recipients = await this.participants.find({ where: { conversationId: dto.conversationId } });
    const recipientIds = recipients.map((r) => r.userId).filter((id) => id !== senderId);

    // doc 18 write-path: gateway broadcast + notification dispatch both
    // subscribe to this event rather than being called inline here.
    this.events.emit('message.created', { message, senderId, recipientIds } as MessageCreatedEvent);

    return message;
  }

  async getMessageHistory(userId: string, conversationId: string, cursor?: string, limit = 50) {
    await this.assertParticipant(conversationId, userId);
    const qb = this.messages
      .createQueryBuilder('m')
      .where('m.conversation_id = :conversationId', { conversationId })
      .andWhere('m.deleted_at IS NULL')
      .orderBy('m.created_at', 'DESC')
      .limit(limit);
    if (cursor) qb.andWhere('m.created_at < :cursor', { cursor: new Date(cursor) });
    return qb.getMany();
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    await this.assertParticipant(conversationId, userId);
    await this.participants.update({ conversationId, userId }, { lastReadAt: new Date() });
    this.events.emit('message.read', { conversationId, userId });
  }

  /** doc 26: delete for everyone purges ciphertext, not just flags it. */
  async deleteForEveryone(userId: string, messageId: string): Promise<void> {
    const message = await this.messages.findOne({ where: { id: messageId } });
    if (!message) throw new NotFoundException('MESSAGE_NOT_FOUND');
    if (message.senderId !== userId) throw new ForbiddenException('NOT_YOUR_MESSAGE');

    message.deletedAt = new Date();
    message.ciphertext = Buffer.alloc(0); // purge, not just flag (doc 26)
    message.ciphertextMeta = {};
    await this.messages.save(message);

    this.events.emit('message.deleted', { messageId, conversationId: message.conversationId });
  }
}
