import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { FeatureFlagsService } from '../../src/modules/feature-flags/feature-flags.service';
import { FeatureFlag } from '../../src/modules/feature-flags/entities/feature-flag.entity';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let flagsRepo: { findOne: jest.Mock; upsert: jest.Mock; find: jest.Mock };
  let cache: Map<string, unknown>;

  beforeEach(async () => {
    flagsRepo = { findOne: jest.fn(), upsert: jest.fn(), find: jest.fn() };
    cache = new Map();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: getRepositoryToken(FeatureFlag), useValue: flagsRepo },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn((k: string) => Promise.resolve(cache.get(k))),
            set: jest.fn((k: string, v: unknown) => {
              cache.set(k, v);
              return Promise.resolve();
            }),
            del: jest.fn((k: string) => {
              cache.delete(k);
              return Promise.resolve();
            }),
          },
        },
      ],
    }).compile();

    service = module.get(FeatureFlagsService);
  });

  it('returns false for an unknown flag rather than throwing', async () => {
    flagsRepo.findOne.mockResolvedValue(null);
    const result = await service.isEnabledForUser('nonexistent_flag', 'user-1');
    expect(result).toBe(false);
  });

  it('returns false when the flag is disabled, regardless of rollout percentage', async () => {
    flagsRepo.findOne.mockResolvedValue({ key: 'new_ui', enabled: false, rolloutPercentage: 100 });
    expect(await service.isEnabledForUser('new_ui', 'user-1')).toBe(false);
  });

  it('returns true for every user when rolloutPercentage is 100', async () => {
    flagsRepo.findOne.mockResolvedValue({ key: 'new_ui', enabled: true, rolloutPercentage: 100 });
    expect(await service.isEnabledForUser('new_ui', 'user-1')).toBe(true);
    expect(await service.isEnabledForUser('new_ui', 'user-2')).toBe(true);
  });

  it('returns false for every user when rolloutPercentage is 0, even though enabled=true', async () => {
    flagsRepo.findOne.mockResolvedValue({ key: 'new_ui', enabled: true, rolloutPercentage: 0 });
    expect(await service.isEnabledForUser('new_ui', 'user-1')).toBe(false);
  });

  it('is deterministic — the same user gets the same result on repeated checks', async () => {
    flagsRepo.findOne.mockResolvedValue({ key: 'new_ui', enabled: true, rolloutPercentage: 50 });
    const first = await service.isEnabledForUser('new_ui', 'user-42');
    // second call hits the cache, not the repo — still must agree with the first result
    const second = await service.isEnabledForUser('new_ui', 'user-42');
    expect(second).toBe(first);
  });

  it('different users can land on different sides of a partial rollout', async () => {
    flagsRepo.findOne.mockResolvedValue({ key: 'new_ui', enabled: true, rolloutPercentage: 50 });
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => service.isEnabledForUser('new_ui', `user-${i}`)),
    );
    // With 20 users at a 50% rollout, expect a real mix — not all-true or all-false.
    expect(results.some((r) => r === true)).toBe(true);
    expect(results.some((r) => r === false)).toBe(true);
  });
});
