import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GiftShowcaseService } from '../../src/modules/gifts/gift-showcase.service';
import { GiftShowcaseSlot } from '../../src/modules/gifts/entities/gift-showcase-slot.entity';
import { GiftInventoryService } from '../../src/modules/gifts/gift-inventory.service';
import { PremiumLimitsService } from '../../src/modules/premium/premium-limits.service';

describe('GiftShowcaseService', () => {
  let service: GiftShowcaseService;
  let slotsRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; delete: jest.Mock };
  let inventory: { getQuantity: jest.Mock };
  let limits: { limitsFor: jest.Mock };

  beforeEach(async () => {
    slotsRepo = { findOne: jest.fn(), save: jest.fn((x) => x), create: jest.fn((x) => x), delete: jest.fn() };
    inventory = { getQuantity: jest.fn() };
    limits = { limitsFor: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiftShowcaseService,
        { provide: getRepositoryToken(GiftShowcaseSlot), useValue: slotsRepo },
        { provide: GiftInventoryService, useValue: inventory },
        { provide: PremiumLimitsService, useValue: limits },
      ],
    }).compile();

    service = module.get(GiftShowcaseService);
  });

  it('rejects a slot position beyond the current tier limit', async () => {
    limits.limitsFor.mockResolvedValue({ maxGiftShowcaseSlots: 3 });

    await expect(service.setSlot('user-1', 5, 'gift-1')).rejects.toThrow(ForbiddenException);
    expect(inventory.getQuantity).not.toHaveBeenCalled();
  });

  it('rejects showcasing a gift the user does not own', async () => {
    limits.limitsFor.mockResolvedValue({ maxGiftShowcaseSlots: 3 });
    inventory.getQuantity.mockResolvedValue(0);

    await expect(service.setSlot('user-1', 1, 'gift-1')).rejects.toThrow(BadRequestException);
    expect(slotsRepo.save).not.toHaveBeenCalled();
  });

  it('allows showcasing an owned gift within the tier limit', async () => {
    limits.limitsFor.mockResolvedValue({ maxGiftShowcaseSlots: 3 });
    inventory.getQuantity.mockResolvedValue(2);
    slotsRepo.findOne.mockResolvedValue(null);

    const result = await service.setSlot('user-1', 1, 'gift-1');

    expect(result).toMatchObject({ userId: 'user-1', position: 1, giftCatalogItemId: 'gift-1' });
  });

  it('a free-tier limit (3) rejects position 4, a premium-tier limit (12) allows it', async () => {
    inventory.getQuantity.mockResolvedValue(1);
    slotsRepo.findOne.mockResolvedValue(null);

    limits.limitsFor.mockResolvedValue({ maxGiftShowcaseSlots: 3 });
    await expect(service.setSlot('free-user', 4, 'gift-1')).rejects.toThrow(ForbiddenException);

    limits.limitsFor.mockResolvedValue({ maxGiftShowcaseSlots: 12 });
    await expect(service.setSlot('premium-user', 4, 'gift-1')).resolves.toBeDefined();
  });
});
