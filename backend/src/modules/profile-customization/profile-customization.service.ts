import { Injectable } from '@nestjs/common';
import { CosmeticsService } from '../premium/cosmetics.service';
import { ProfileExtrasService } from '../premium/profile-extras.service';
import { PremiumService } from '../premium/premium.service';
import { GiftShowcaseService } from '../gifts/gift-showcase.service';
import { BadgeShowcaseService } from './badge-showcase.service';
import { AchievementShowcaseService } from './achievement-showcase.service';

/**
 * doc PROFILE.md "Premium Showcase": the single response that renders a
 * full profile's customization — every category from Stage 7/8/10 in one
 * call, so a client doesn't need N separate requests to paint one profile
 * screen. This is deliberately a read-only composition layer; it owns no
 * data of its own and no business rules — every check (premium gating,
 * ownership, slot limits) already lives in the module that owns that
 * concern, called here, not reimplemented.
 */
@Injectable()
export class ProfileCustomizationService {
  constructor(
    private readonly cosmetics: CosmeticsService,
    private readonly profileExtras: ProfileExtrasService,
    private readonly premium: PremiumService,
    private readonly giftShowcase: GiftShowcaseService,
    private readonly badgeShowcase: BadgeShowcaseService,
    private readonly achievementShowcase: AchievementShowcaseService,
  ) {}

  async getFullDisplay(userId: string) {
    const [isPremium, cosmeticSelections, extras, giftShowcaseSlots, badgeShowcaseSlots, achievementShowcaseSlots] =
      await Promise.all([
        this.premium.isPremium(userId),
        this.cosmetics.getSelectionsForUser(userId), // badge, frame, theme, username_color, wallpaper, profile_effect, banner, status_icon
        this.profileExtras.getPublicDisplay(userId), // statusText, statusEmoji, animatedProfileEnabled, videoAvatarAssetId
        this.giftShowcase.getShowcase(userId),
        this.badgeShowcase.getShowcase(userId),
        this.achievementShowcase.getShowcase(userId),
      ]);

    return {
      isPremium,
      cosmetics: cosmeticSelections,
      status: {
        text: extras.statusText,
        emoji: extras.statusEmoji,
        icon: cosmeticSelections.status_icon,
      },
      animatedProfileEnabled: extras.animatedProfileEnabled,
      videoAvatarAssetId: extras.videoAvatarAssetId,
      showcases: {
        gifts: giftShowcaseSlots,
        badges: badgeShowcaseSlots,
        achievements: achievementShowcaseSlots,
      },
    };
  }
}
