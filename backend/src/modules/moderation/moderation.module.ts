import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';
import { ReportsService } from './reports.service';
import { ModerationActionsService } from './moderation-actions.service';
import { ReportsController } from './reports.controller';
import { ModerationAdminController } from './moderation-admin.controller';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report, AdminAuditLog]), PostsModule, CommentsModule, NotificationsModule],
  controllers: [ReportsController, ModerationAdminController],
  providers: [ReportsService, ModerationActionsService],
  exports: [ReportsService],
})
export class ModerationModule {}
