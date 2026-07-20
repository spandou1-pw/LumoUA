import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionDefinition } from './entities/mission-definition.entity';
import { UserMissionProgress } from './entities/user-mission-progress.entity';
import { MissionsService } from './missions.service';
import { MissionsController, MissionsAdminController } from './missions.controller';
import { WalletModule } from '../../wallet/wallet.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([MissionDefinition, UserMissionProgress]), WalletModule, NotificationsModule],
  controllers: [MissionsController, MissionsAdminController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}
