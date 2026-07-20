import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { BadgeShowcaseSlot } from './entities/badge-showcase-slot.entity';
import { AchievementShowcaseSlot } from './entities/achievement-showcase-slot.entity';
import { AchievementsService } from './achievements.service';
import { BadgeShowcaseService } from './badge-showcase.service';
import { AchievementShowcaseService } from './achievement-showcase.service';
import { ProfileCustomizationService } from './profile-customization.service';
import { ProfileCustomizationController } from './profile-customization.controller';
import { ProfileCustomizationAdminController } from './profile-customization-admin.controller';
import { PremiumModule } from '../premium/premium.module';
import { GiftsModule } from '../gifts/gifts.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * doc PROFILE.md: this module depends on both PremiumModule and
 * GiftsModule (for the Premium Showcase aggregate). GiftsModule already
 * depends on PremiumModule (Stage 8, for showcase slot limits) — putting
 * the aggregator in a new top-level module, rather than inside Premium or
 * Gifts, avoids Premium <-> Gifts becoming circularly dependent on each
 * other.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement, UserAchievement, BadgeShowcaseSlot, AchievementShowcaseSlot]),
    PremiumModule,
    GiftsModule,
    NotificationsModule,
  ],
  controllers: [ProfileCustomizationController, ProfileCustomizationAdminController],
  providers: [AchievementsService, BadgeShowcaseService, AchievementShowcaseService, ProfileCustomizationService],
  exports: [AchievementsService],
})
export class ProfileCustomizationModule {}
