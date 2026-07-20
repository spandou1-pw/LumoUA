import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PremiumLimitsService } from '../../src/modules/premium/premium-limits.service';
import { PremiumReactionsService } from '../../src/modules/premium/premium-reactions.service';
import { PremiumReaction } from '../../src/modules/premium/entities/premium-reaction.entity';
import { PremiumService } from '../../src/modules/premium/premium.service';

describe('PremiumLimitsService', () => {
  let service: PremiumLimitsService;
  let premium: { isPremium: jest.Mock };

  beforeEach(async () => {
    premium = { isPremium: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [PremiumLimitsService, { provide: PremiumService, useValue: premium }],
    }).compile();
    service = module.get(PremiumLimitsService);
  });

  it('returns the free limit set for a non-premium user', async () => {
    premium.isPremium.mockResolvedValue(false);
    const limits = await service.limitsFor('user-1');
    expect(limits).toEqual(service.getFreeLimits());
  });

  it('returns strictly higher limits for a premium user', async () => {
    premium.isPremium.mockResolvedValue(true);
    const limits = await service.limitsFor('user-1');
    const free = service.getFreeLimits();

    expect(limits.maxPinnedChats).toBeGreaterThan(free.maxPinnedChats);
    expect(limits.maxDevices).toBeGreaterThan(free.maxDevices);
    expect(limits.maxUploadSizeMB).toBeGreaterThan(free.maxUploadSizeMB);
    expect(limits.chatFoldersEnabled).toBe(true);
    expect(free.chatFoldersEnabled).toBe(false);
  });
});

describe('PremiumReactionsService — gating and validation', () => {
  let service: PremiumReactionsService;
  let repo: { upsert: jest.Mock; delete: jest.Mock };
  let premium: { isPremium: jest.Mock };
  let events: { emit: jest.Mock };

  beforeEach(async () => {
    repo = { upsert: jest.fn(), delete: jest.fn() };
    premium = { isPremium: jest.fn() };
    events = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PremiumReactionsService,
        { provide: getRepositoryToken(PremiumReaction), useValue: repo },
        { provide: PremiumService, useValue: premium },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();

    service = module.get(PremiumReactionsService);
  });

  it('rejects a reaction from a non-premium user', async () => {
    premium.isPremium.mockResolvedValue(false);

    await expect(service.react('user-1', 'post', 'post-1', '❤️')).rejects.toThrow(ForbiddenException);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('rejects an emoji outside the allowed set, even for a premium user', async () => {
    premium.isPremium.mockResolvedValue(true);

    await expect(service.react('user-1', 'post', 'post-1', '🍕')).rejects.toThrow(ForbiddenException);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('accepts an allowed emoji from a premium user and emits the domain event', async () => {
    premium.isPremium.mockResolvedValue(true);

    await service.react('user-1', 'post', 'post-1', '🔥');

    expect(repo.upsert).toHaveBeenCalledWith(
      { userId: 'user-1', targetType: 'post', targetId: 'post-1', emoji: '🔥' },
      ['userId', 'targetType', 'targetId'],
    );
    expect(events.emit).toHaveBeenCalledWith('premium_reaction.created', expect.objectContaining({ emoji: '🔥' }));
  });
});
