import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementShowcaseSlot } from './entities/achievement-showcase-slot.entity';
import { AchievementsService } from './achievements.service';
import { PremiumLimitsService } from '../premium/premium-limits.service';

@Injectable()
export class AchievementShowcaseService {
  constructor(
    @InjectRepository(AchievementShowcaseSlot) private readonly slots: Repository<AchievementShowcaseSlot>,
    private readonly achievements: AchievementsService,
    private readonly limits: PremiumLimitsService,
  ) {}

  async getShowcase(userId: string): Promise<AchievementShowcaseSlot[]> {
    return this.slots.find({ where: { userId }, order: { position: 'ASC' } });
  }

  /** doc PROFILE.md: can only showcase an achievement actually earned — verified against UserAchievement, not trusted from the request. */
  async setSlot(userId: string, position: number, achievementId: string): Promise<AchievementShowcaseSlot> {
    const limits = await this.limits.limitsFor(userId);
    if (position < 1 || position > limits.maxAchievementShowcaseSlots) {
      throw new ForbiddenException('SHOWCASE_SLOT_OUT_OF_RANGE_FOR_CURRENT_TIER');
    }

    const earned = await this.achievements.hasEarned(userId, achievementId);
    if (!earned) throw new BadRequestException('CANNOT_SHOWCASE_AN_UNEARNED_ACHIEVEMENT');

    const existing = await this.slots.findOne({ where: { userId, position } });
    if (existing) {
      existing.achievementId = achievementId;
      return this.slots.save(existing);
    }
    return this.slots.save(this.slots.create({ userId, position, achievementId }));
  }

  async clearSlot(userId: string, position: number): Promise<void> {
    await this.slots.delete({ userId, position });
  }
}
