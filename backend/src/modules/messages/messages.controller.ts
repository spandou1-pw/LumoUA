import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { PublishDeviceKeysDto, SendMessageDto, StartConversationDto } from './dto/message.dto';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('devices/keys')
  async publishKeys(@CurrentUser('id') userId: string, @Body() dto: PublishDeviceKeysDto) {
    await this.messagesService.publishDeviceKeys(userId, dto);
    return { published: true };
  }

  @Get('devices/:userId/keys')
  async getKeys(@Param('userId') userId: string) {
    return this.messagesService.getPrekeyBundle(userId);
  }

  @Get('conversations')
  async listConversations(@CurrentUser('id') userId: string) {
    return this.messagesService.listConversationsForUser(userId);
  }

  @Post('conversations')
  async startConversation(@CurrentUser('id') userId: string, @Body() dto: StartConversationDto) {
    return this.messagesService.startDirectConversation(userId, dto.recipientId);
  }

  @Get('conversations/:id/messages')
  async history(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.getMessageHistory(userId, conversationId, cursor);
  }

  // doc 22: real-time send/receive happens over WebSocket — this REST path
  // covers clients that need a fallback (e.g. WS unavailable, doc 19) or
  // server-to-server sends; both routes call the same service method so
  // behavior never diverges between transports.
  @Post('messages')
  async sendViaRest(@CurrentUser('id') userId: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(userId, dto);
  }

  @Delete('messages/:id')
  async deleteMessage(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.messagesService.deleteForEveryone(userId, id);
    return { deleted: true };
  }
}
