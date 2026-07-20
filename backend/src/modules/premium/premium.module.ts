import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CosmeticItem } from './entities/cosmetic-item.entity';
import { UserCosmeticSelection } from './entities/user-cosmetic-selection.entity';
import { UserProfileExtras } from './entities/user-profile-extras.entity';
import { PremiumAssetPack } from './entities/premium-asset-pack.entity';
import { PremiumReaction } from './entities/premium-reaction.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PremiumService } from './premium.service';
import { CosmeticsService } from './cosmetics.service';
import { ProfileExtrasService } from './profile-extras.service';
import { PremiumReactionsService } from './premium-reactions.service';
import { PremiumLimitsService } from './premium-limits.service';
import { PremiumAnalyticsService } from './premium-analytics.service';
import { PremiumController } from './premium.controller';
import { PremiumAdminController } from './premium-admin.controller';
import { PremiumGuard } from './guards/premium.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CosmeticItem,
      UserCosmeticSelection,
      UserProfileExtras,
      PremiumAssetPack,
      PremiumReaction,
      Subscription,
    ]),
    SubscriptionsModule,
    FilesModule,
  ],
  controllers: [PremiumController, PremiumAdminController],
  providers: [
    PremiumService,
    CosmeticsService,
    ProfileExtrasService,
    PremiumReactionsService,
    PremiumLimitsService,
    PremiumAnalyticsService,
    PremiumGuard,
  ],
  exports: [PremiumService, PremiumLimitsService, CosmeticsService, ProfileExtrasService],
})
export class PremiumModule {}
