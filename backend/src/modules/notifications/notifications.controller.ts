import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { PushPlatform } from './entities/device-token.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string, @Query('cursor') cursor?: string) {
    return this.notificationsService.listForUser(userId, cursor);
  }

  @Patch(':id/read')
  async markRead(@CurrentUser('id') userId: string, @Body('id') id: string) {
    await this.notificationsService.markRead(userId, id);
    return { read: true };
  }

  @Post('devices')
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body('deviceId') deviceId: string,
    @Body('platform') platform: PushPlatform,
    @Body('pushToken') pushToken: string,
  ) {
    await this.notificationsService.registerDeviceToken(userId, deviceId, platform, pushToken);
    return { registered: true };
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body()
    updates: Partial<{ messagesEnabled: boolean; socialEngagementEnabled: boolean; friendRequestsEnabled: boolean }>,
  ) {
    return this.notificationsService.updatePreferences(userId, updates);
  }
}
