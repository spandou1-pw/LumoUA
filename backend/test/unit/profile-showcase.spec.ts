import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadgeShowcaseService } from '../../src/modules/profile-customization/badge-showcase.service';
import { BadgeShowcaseSlot } from '../../src/modules/profile-customization/entities/badge-showcase-slot.entity';
import { AchievementShowcaseService } from '../../src/modules/profile-customization/achievement-showcase.service';
import { AchievementShowcaseSlot } from '../../src/modules/profile-customization/entities/achievement-showcase-slot.entity';
import { CosmeticsService } from '../../src/modules/premium/cosmetics.service';
import { PremiumLimitsService } from '../../src/modules/premium/premium-limits.service';
import { PremiumService } from '../../src/modules/premium/premium.service';
import { AchievementsService } from '../../src/modules/profile-customization/achievements.service';

describe('BadgeShowcaseService', () => {
  let service: BadgeShowcaseService;
  let slotsRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let cosmetics: { listCatalog: jest.Mock };
  let limits: { limitsFor: jest.Mock };
  let premium: { isPremium: jest.Mock };

  beforeEach(async () => {
    slotsRepo = { findOne: jest.fn(), save: jest.fn((x) => x), create: jest.fn((x) => x) };
    cosmetics = { listCatalog: jest.fn() };
    limits = { limitsFor: jest.fn() };
    premium = { isPremium: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeShowcaseService,
        { provide: getRepositoryToken(BadgeShowcaseSlot), useValue: slotsRepo },
        { provide: CosmeticsService, useValue: cosmetics },
        { provide: PremiumLimitsService, useValue: limits },
        { provide: PremiumService, useValue: premium },
      ],
    }).compile();

    service = module.get(BadgeShowcaseService);
  });

  it('rejects a slot beyond the tier limit', async () => {
    limits.limitsFor.mockResolvedValue({ maxBadgeShowcaseSlots: 3 });

    await expect(service.setSlot('user-1', 4, 'badge-1')).rejects.toThrow(ForbiddenException);
  });

  it('rejects a badge id not present in the active badge catalog', async () => {
    limits.limitsFor.mockResolvedValue({ maxBadgeShowcaseSlots: 3 });
    cosmetics.listCatalog.mockResolvedValue([{ id: 'badge-other', requiresPremium: false }]);

    await expect(service.setSlot('user-1', 1, 'badge-missing')).rejects.toThrow(NotFoundException);
  });

  it('rejects a premium-exclusive badge for a non-premium user', async () => {
    limits.limitsFor.mockResolvedValue({ maxBadgeShowcaseSlots: 3 });
    cosmetics.listCatalog.mockResolvedValue([{ id: 'badge-gold', requiresPremium: true }]);
    premium.isPremium.mockResolvedValue(false);

    await expect(service.setSlot('user-1', 1, 'badge-gold')).rejects.toThrow(ForbiddenException);
  });

  it('allows a premium user to showcase a premium badge within their slot limit', async () => {
    limits.limitsFor.mockResolvedValue({ maxBadgeShowcaseSlots: 3 });
    cosmetics.listCatalog.mockResolvedValue([{ id: 'badge-gold', requiresPremium: true }]);
    premium.isPremium.mockResolvedValue(true);
    slotsRepo.findOne.mockResolvedValue(null);

    const result = await service.setSlot('user-1', 1, 'badge-gold');
    expect(result).toMatchObject({ userId: 'user-1', position: 1, cosmeticItemId: 'badge-gold' });
  });
});

describe('AchievementShowcaseService', () => {
  let service: AchievementShowcaseService;
  let slotsRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let achievements: { hasEarned: jest.Mock };
  let limits: { limitsFor: jest.Mock };

  beforeEach(async () => {
    slotsRepo = { findOne: jest.fn(), save: jest.fn((x) => x), create: jest.fn((x) => x) };
    achievements = { hasEarned: jest.fn() };
    limits = { limitsFor: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementShowcaseService,
        { provide: getRepositoryToken(AchievementShowcaseSlot), useValue: slotsRepo },
        { provide: AchievementsService, useValue: achievements },
        { provide: PremiumLimitsService, useValue: limits },
      ],
    }).compile();

    service = module.get(AchievementShowcaseService);
  });

  it('rejects showcasing an achievement the user has not earned', async () => {
    limits.limitsFor.mockResolvedValue({ maxAchievementShowcaseSlots: 3 });
    achievements.hasEarned.mockResolvedValue(false);

    await expect(service.setSlot('user-1', 1, 'ach-1')).rejects.toThrow(BadRequestException);
  });

  it('allows showcasing an earned achievement within the slot limit', async () => {
    limits.limitsFor.mockResolvedValue({ maxAchievementShowcaseSlots: 3 });
    achievements.hasEarned.mockResolvedValue(true);
    slotsRepo.findOne.mockResolvedValue(null);

    const result = await service.setSlot('user-1', 1, 'ach-1');
    expect(result).toMatchObject({ userId: 'user-1', position: 1, achievementId: 'ach-1' });
  });
});
