import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftShowcaseSlot } from './entities/gift-showcase-slot.entity';
import { GiftInventoryService } from './gift-inventory.service';
import { PremiumLimitsService } from '../premium/premium-limits.service';

@Injectable()
export class GiftShowcaseService {
  constructor(
    @InjectRepository(GiftShowcaseSlot) private readonly slots: Repository<GiftShowcaseSlot>,
    private readonly inventory: GiftInventoryService,
    private readonly limits: PremiumLimitsService,
  ) {}

  async getShowcase(userId: string): Promise<GiftShowcaseSlot[]> {
    return this.slots.find({ where: { userId }, order: { position: 'ASC' } });
  }

  /**
   * doc GIFTS.md "Gift Showcase": can only feature a gift the user actually
   * owns (verified against inventory, not trusted from the request) — and
   * only into a slot within their current limit (doc PREMIUM.md
   * PremiumLimitsService), so a lapsed subscription doesn't let a user
   * keep more showcased gifts than their new tier allows on the *next*
   * write (existing over-limit slots aren't retroactively deleted, only
   * new placements beyond the limit are blocked — consistent with how
   * subscription lapses are handled elsewhere: access changes going
   * forward, not silent data loss).
   */
  async setSlot(userId: string, position: number, giftCatalogItemId: string): Promise<GiftShowcaseSlot> {
    const limits = await this.limits.limitsFor(userId);
    if (position < 1 || position > limits.maxGiftShowcaseSlots) {
      throw new ForbiddenException('SHOWCASE_SLOT_OUT_OF_RANGE_FOR_CURRENT_TIER');
    }

    const owned = await this.inventory.getQuantity(userId, giftCatalogItemId);
    if (owned <= 0) {
      throw new BadRequestException('CANNOT_SHOWCASE_A_GIFT_YOU_DO_NOT_OWN');
    }

    const existing = await this.slots.findOne({ where: { userId, position } });
    if (existing) {
      existing.giftCatalogItemId = giftCatalogItemId;
      return this.slots.save(existing);
    }
    return this.slots.save(this.slots.create({ userId, position, giftCatalogItemId }));
  }

  async clearSlot(userId: string, position: number): Promise<void> {
    await this.slots.delete({ userId, position });
  }
}
