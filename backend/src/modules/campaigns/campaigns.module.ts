import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Campaign } from './entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsAdminController } from './campaigns-admin.controller';
import { CampaignDispatchProcessor } from './campaign-dispatch.processor';
import { EmailProvider } from './providers/email.provider';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, User, Subscription]),
    BullModule.registerQueue({ name: 'campaign-dispatch' }),
    NotificationsModule,
  ],
  controllers: [CampaignsAdminController],
  providers: [CampaignsService, CampaignDispatchProcessor, EmailProvider],
})
export class CampaignsModule {}
