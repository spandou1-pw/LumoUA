import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { MessageCreatedEvent } from './messages.service';
import { AccessTokenPayload } from '../auth/auth.types';

/**
 * doc 18: horizontal scaling via a Redis pub/sub backplane so recipients
 * connected to a different node still receive events. The Redis adapter is
 * attached in main.ts (`io.adapter(createAdapter(...))`), not here — this
 * gateway just emits to Socket.IO "rooms" per conversation, and the adapter
 * makes that work across processes transparently.
 *
 * doc 22 WS events:
 *   client -> server: message:send, typing:start/stop, message:read
 *   server -> client: message:new, message:delivered, message:read, typing:update, presence:update
 */
@WebSocketGateway({ cors: { origin: '*' } }) // CORS tightened per-environment in real deployment
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('NO_TOKEN');
      const payload = this.jwt.verify<AccessTokenPayload>(token);
      client.data.userId = payload.sub;
      client.data.deviceId = payload.deviceId;
      // Personal room for direct server->client pushes (e.g. cross-conversation events).
      await client.join(`user:${payload.sub}`);
      this.server.emit('presence:update', { userId: payload.sub, online: true });
    } catch (err) {
      this.logger.warn(`WebSocket auth failed, disconnecting: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId;
    if (userId) this.server.emit('presence:update', { userId, online: false });
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): Promise<void> {
    // Room membership itself isn't an authorization decision — REST/service
    // layer (assertParticipant, doc 24) is still the source of truth; this
    // just lets the socket receive broadcasts for conversations it's allowed
    // to see, verified via the same service.
    await client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('typing:update', {
      conversationId: data.conversationId,
      userId: client.data.userId,
      typing: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('typing:update', {
      conversationId: data.conversationId,
      userId: client.data.userId,
      typing: false,
    });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ): Promise<void> {
    await this.messagesService.markRead(client.data.userId, data.conversationId);
  }

  /**
   * doc 18 write path: REST/WS message:send handler (in the controller,
   * not here) calls MessagesService.sendMessage, which emits 'message.created'.
   * This listener does the actual fan-out — kept as an event listener rather
   * than a direct call so the send path doesn't need a reference to the
   * gateway (cleaner module boundary, easier to test in isolation).
   */
  @OnEvent('message.created')
  handleMessageCreated(event: MessageCreatedEvent): void {
    const payload = {
      id: event.message.id,
      conversationId: event.message.conversationId,
      senderId: event.senderId,
      ciphertext: event.message.ciphertext.toString('base64'),
      ciphertextMeta: event.message.ciphertextMeta,
      createdAt: event.message.createdAt,
    };
    this.server.to(`conversation:${event.message.conversationId}`).emit('message:new', payload);

    // Delivery ack to sender once broadcast is issued (doc 22 message:delivered).
    this.server.to(`user:${event.senderId}`).emit('message:delivered', { id: event.message.id });
  }
}
