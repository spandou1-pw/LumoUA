import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationRecord } from './entities/notification.entity';
import { DevicePushToken } from './entities/device-token.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Announcement } from './entities/announcement.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AnnouncementsAdminController } from './announcements-admin.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementBroadcastProcessor } from './announcements.processor';
import { PushDispatcher } from './dispatchers/push.dispatcher';
import { NotificationDispatchProcessor } from './dispatchers/notification-dispatch.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRecord, DevicePushToken, NotificationPreference, Announcement, User]),
    BullModule.registerQueue({ name: 'notification-dispatch' }, { name: 'announcement-broadcast' }),
  ],
  controllers: [NotificationsController, AnnouncementsAdminController],
  providers: [
    NotificationsService,
    PushDispatcher,
    NotificationDispatchProcessor,
    AnnouncementsService,
    AnnouncementBroadcastProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
