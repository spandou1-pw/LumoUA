import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SafetyFiltersService } from '../../src/modules/ai-platform/safety-filters/safety-filters.service';
import { SafetyFilterTerm } from '../../src/modules/ai-platform/safety-filters/entities/safety-filter-term.entity';

describe('SafetyFiltersService', () => {
  let service: SafetyFiltersService;
  let termsRepo: { find: jest.Mock };
  let cache: Map<string, unknown>;

  beforeEach(async () => {
    termsRepo = { find: jest.fn() };
    cache = new Map();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafetyFiltersService,
        { provide: getRepositoryToken(SafetyFilterTerm), useValue: termsRepo },
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

    service = module.get(SafetyFiltersService);
  });

  it('returns null when no terms are configured', async () => {
    termsRepo.find.mockResolvedValue([]);
    expect(await service.check('any text at all')).toBeNull();
  });

  it('matches a literal (non-regex) term, case-insensitively', async () => {
    termsRepo.find.mockResolvedValue([
      { pattern: 'testword', isRegex: false, category: 'spam', severity: 50, active: true },
    ]);
    const result = await service.check('this contains TestWord in it');
    expect(result).toMatchObject({ category: 'spam', severity: 50 });
  });

  it('returns null when text does not match any active term', async () => {
    termsRepo.find.mockResolvedValue([
      { pattern: 'testword', isRegex: false, category: 'spam', severity: 50, active: true },
    ]);
    expect(await service.check('perfectly innocent text')).toBeNull();
  });

  it('matches a regex pattern term', async () => {
    termsRepo.find.mockResolvedValue([
      { pattern: '\\btest\\d+\\b', isRegex: true, category: 'harassment', severity: 80, active: true },
    ]);
    const result = await service.check('here is test123 in a sentence');
    expect(result).toMatchObject({ category: 'harassment', severity: 80 });
  });

  it('fails closed (no match) on an invalid regex pattern rather than throwing', async () => {
    termsRepo.find.mockResolvedValue([
      { pattern: '(unclosed[', isRegex: true, category: 'other', severity: 40, active: true },
    ]);
    await expect(service.check('some text')).resolves.toBeNull();
  });

  it('returns the highest-severity match when multiple terms match', async () => {
    termsRepo.find.mockResolvedValue([
      { pattern: 'foo', isRegex: false, category: 'spam', severity: 30, active: true },
      { pattern: 'bar', isRegex: false, category: 'illegal_content', severity: 95, active: true },
    ]);
    const result = await service.check('this text contains both foo and bar');
    expect(result?.severity).toBe(95);
    expect(result?.category).toBe('illegal_content');
  });

  it('caches the active term list and does not re-query the repository on a second check', async () => {
    termsRepo.find.mockResolvedValue([{ pattern: 'x', isRegex: false, category: 'spam', severity: 10, active: true }]);
    await service.check('has x in it');
    await service.check('also has x in it');
    expect(termsRepo.find).toHaveBeenCalledTimes(1);
  });
});
