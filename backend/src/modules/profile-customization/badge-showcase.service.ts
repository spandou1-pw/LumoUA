import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadgeShowcaseSlot } from './entities/badge-showcase-slot.entity';
import { CosmeticsService } from '../premium/cosmetics.service';
import { PremiumLimitsService } from '../premium/premium-limits.service';
import { PremiumService } from '../premium/premium.service';

@Injectable()
export class BadgeShowcaseService {
  constructor(
    @InjectRepository(BadgeShowcaseSlot) private readonly slots: Repository<BadgeShowcaseSlot>,
    private readonly cosmetics: CosmeticsService,
    private readonly limits: PremiumLimitsService,
    private readonly premium: PremiumService,
  ) {}

  async getShowcase(userId: string): Promise<BadgeShowcaseSlot[]> {
    return this.slots.find({ where: { userId }, order: { position: 'ASC' } });
  }

  /**
   * doc PROFILE.md: showcasing a badge requires the badge to actually be
   * one the user could equip — i.e. it exists, is active, and if it's
   * premium-exclusive, the user is currently premium. There's no separate
   * "owns this badge" concept distinct from "is entitled to select it"
   * (Stage 7's model — badges aren't individually unlocked/purchased items,
   * entitlement is subscription-wide), unlike Gift Showcase where
   * inventory ownership is per-item.
   */
  async setSlot(userId: string, position: number, cosmeticItemId: string): Promise<BadgeShowcaseSlot> {
    const limits = await this.limits.limitsFor(userId);
    if (position < 1 || position > limits.maxBadgeShowcaseSlots) {
      throw new ForbiddenException('SHOWCASE_SLOT_OUT_OF_RANGE_FOR_CURRENT_TIER');
    }

    const catalog = await this.cosmetics.listCatalog('badge');
    const item = catalog.find((i) => i.id === cosmeticItemId);
    if (!item) throw new NotFoundException('BADGE_NOT_FOUND');
    if (item.requiresPremium && !(await this.premium.isPremium(userId))) {
      throw new ForbiddenException('PREMIUM_SUBSCRIPTION_REQUIRED');
    }

    const existing = await this.slots.findOne({ where: { userId, position } });
    if (existing) {
      existing.cosmeticItemId = cosmeticItemId;
      return this.slots.save(existing);
    }
    return this.slots.save(this.slots.create({ userId, position, cosmeticItemId }));
  }

  async clearSlot(userId: string, position: number): Promise<void> {
    await this.slots.delete({ userId, position });
  }
}
