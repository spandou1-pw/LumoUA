import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CosmeticsService } from '../../src/modules/premium/cosmetics.service';
import { CosmeticItem } from '../../src/modules/premium/entities/cosmetic-item.entity';
import { UserCosmeticSelection } from '../../src/modules/premium/entities/user-cosmetic-selection.entity';
import { PremiumService } from '../../src/modules/premium/premium.service';

describe('CosmeticsService — premium gating', () => {
  let service: CosmeticsService;
  let itemsRepo: { findOne: jest.Mock; find: jest.Mock };
  let selectionsRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; delete: jest.Mock };
  let premium: { isPremium: jest.Mock };

  beforeEach(async () => {
    itemsRepo = { findOne: jest.fn(), find: jest.fn() };
    selectionsRepo = {
      findOne: jest.fn(),
      save: jest.fn((x) => x),
      create: jest.fn((x) => x),
      delete: jest.fn(),
    };
    premium = { isPremium: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CosmeticsService,
        { provide: getRepositoryToken(CosmeticItem), useValue: itemsRepo },
        { provide: getRepositoryToken(UserCosmeticSelection), useValue: selectionsRepo },
        { provide: PremiumService, useValue: premium },
      ],
    }).compile();

    service = module.get(CosmeticsService);
  });

  it('throws NOT_FOUND for a nonexistent or inactive cosmetic item', async () => {
    itemsRepo.findOne.mockResolvedValue(null);

    await expect(service.select('user-1', 'badge', 'missing-item')).rejects.toThrow(NotFoundException);
  });

  it('rejects selecting a premium-exclusive item for a non-premium user', async () => {
    itemsRepo.findOne.mockResolvedValue({ id: 'badge-gold', category: 'badge', requiresPremium: true, active: true });
    premium.isPremium.mockResolvedValue(false);

    await expect(service.select('user-1', 'badge', 'badge-gold')).rejects.toThrow(ForbiddenException);
    expect(selectionsRepo.save).not.toHaveBeenCalled();
  });

  it('allows a non-premium user to select an item that does not require premium', async () => {
    itemsRepo.findOne.mockResolvedValue({ id: 'badge-default', category: 'badge', requiresPremium: false, active: true });
    premium.isPremium.mockResolvedValue(false);
    selectionsRepo.findOne.mockResolvedValue(null);

    const result = await service.select('user-1', 'badge', 'badge-default');

    expect(result).toMatchObject({ userId: 'user-1', category: 'badge', cosmeticItemId: 'badge-default' });
  });

  it('allows a premium user to select a premium-exclusive item', async () => {
    itemsRepo.findOne.mockResolvedValue({ id: 'frame-fire', category: 'frame', requiresPremium: true, active: true });
    premium.isPremium.mockResolvedValue(true);
    selectionsRepo.findOne.mockResolvedValue(null);

    const result = await service.select('user-1', 'frame', 'frame-fire');

    expect(result).toMatchObject({ userId: 'user-1', category: 'frame', cosmeticItemId: 'frame-fire' });
  });

  it('replaces an existing selection in the same category rather than creating a second row (one active item per category)', async () => {
    itemsRepo.findOne.mockResolvedValue({ id: 'theme-2', category: 'theme', requiresPremium: true, active: true });
    premium.isPremium.mockResolvedValue(true);
    const existing = { userId: 'user-1', category: 'theme', cosmeticItemId: 'theme-1' };
    selectionsRepo.findOne.mockResolvedValue(existing);

    const result = await service.select('user-1', 'theme', 'theme-2');

    expect(selectionsRepo.create).not.toHaveBeenCalled();
    expect(result.cosmeticItemId).toBe('theme-2');
  });
});
