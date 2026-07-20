import { Injectable } from '@nestjs/common';
import { PremiumService } from './premium.service';

export interface LimitSet {
  maxPinnedChats: number;
  maxDevices: number;
  maxUploadSizeMB: number;
  dailyGiftSendLimit: number;
  maxCommunityCreations: number;
  chatFoldersEnabled: boolean;
  maxGiftShowcaseSlots: number;
  dailyCoinTransferLimit: number;
  maxBadgeShowcaseSlots: number;
  maxAchievementShowcaseSlots: number;
}

/**
 * doc PREMIUM.md "Premium Limits": one place every other module asks
 * "what's this user's limit for X" — keeps free-vs-premium numbers from
 * being hardcoded/duplicated (and drifting) across Messages/Files/Gifts/
 * Communities. Modules call `limitsFor(userId)` and read the field they
 * care about; they don't independently decide what premium unlocks.
 */
const FREE_LIMITS: LimitSet = {
  maxPinnedChats: 3,
  maxDevices: 2,
  maxUploadSizeMB: 15,
  dailyGiftSendLimit: 10,
  maxCommunityCreations: 1,
  chatFoldersEnabled: false,
  maxGiftShowcaseSlots: 3,
  dailyCoinTransferLimit: 5000,
  maxBadgeShowcaseSlots: 3,
  maxAchievementShowcaseSlots: 3,
};

const PREMIUM_LIMITS: LimitSet = {
  maxPinnedChats: 20,
  maxDevices: 5,
  maxUploadSizeMB: 100,
  dailyGiftSendLimit: 100,
  maxCommunityCreations: 10,
  chatFoldersEnabled: true,
  maxGiftShowcaseSlots: 12,
  dailyCoinTransferLimit: 50000,
  maxBadgeShowcaseSlots: 10,
  maxAchievementShowcaseSlots: 10,
};

@Injectable()
export class PremiumLimitsService {
  constructor(private readonly premium: PremiumService) {}

  async limitsFor(userId: string): Promise<LimitSet> {
    return (await this.premium.isPremium(userId)) ? PREMIUM_LIMITS : FREE_LIMITS;
  }

  getFreeLimits(): LimitSet {
    return FREE_LIMITS;
  }

  getPremiumLimits(): LimitSet {
    return PREMIUM_LIMITS;
  }
}
