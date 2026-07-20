import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralCode } from './entities/referral-code.entity';
import { Referral } from './entities/referral.entity';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { ReferralEventsListener } from './referral-events.listener';
import { WalletModule } from '../../wallet/wallet.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReferralCode, Referral]), WalletModule, NotificationsModule],
  controllers: [ReferralsController],
  providers: [ReferralsService, ReferralEventsListener],
  exports: [ReferralsService],
})
export class ReferralsModule {}
