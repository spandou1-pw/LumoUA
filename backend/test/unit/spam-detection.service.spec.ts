import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SpamDetectionService } from '../../src/modules/ai-platform/spam-detection/spam-detection.service';
import { SpamSignal } from '../../src/modules/ai-platform/spam-detection/entities/spam-signal.entity';

describe('SpamDetectionService — pure helper functions', () => {
  it('normalizeContentHash produces the same hash regardless of whitespace/case differences', () => {
    const a = SpamDetectionService.normalizeContentHash('Buy Cheap Watches NOW');
    const b = SpamDetectionService.normalizeContentHash('  buy   cheap watches now  ');
    expect(a).toBe(b);
  });

  it('normalizeContentHash produces different hashes for genuinely different content', () => {
    const a = SpamDetectionService.normalizeContentHash('hello world');
    const b = SpamDetectionService.normalizeContentHash('goodbye world');
    expect(a).not.toBe(b);
  });

  it('linkDensity is 0 for text with no links', () => {
    expect(SpamDetectionService.linkDensity('just a normal post about my day')).toBe(0);
  });

  it('linkDensity increases with more links relative to word count', () => {
    const oneLink = SpamDetectionService.linkDensity('check this out https://example.com nice right');
    const manyLinks = SpamDetectionService.linkDensity('https://a.com https://b.com https://c.com go now');
    expect(manyLinks).toBeGreaterThan(oneLink);
  });
});

describe('SpamDetectionService — check() heuristics', () => {
  let service: SpamDetectionService;
  let signalsRepo: { save: jest.Mock; create: jest.Mock };
  let cache: Map<string, unknown>;

  beforeEach(async () => {
    signalsRepo = { save: jest.fn((x) => x), create: jest.fn((x) => x) };
    cache = new Map();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpamDetectionService,
        { provide: getRepositoryToken(SpamSignal), useValue: signalsRepo },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn((k: string) => Promise.resolve(cache.get(k))),
            set: jest.fn((k: string, v: unknown) => {
              cache.set(k, v);
              return Promise.resolve();
            }),
          },
        },
      ],
    }).compile();

    service = module.get(SpamDetectionService);
  });

  it('does not flag a normal post from an established account', async () => {
    const oldAccount = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await service.check('user-1', 'post', 'post-1', 'Мій кіт сьогодні дуже кумедний 😺', oldAccount);
    expect(result.isSuspicious).toBe(false);
    expect(result.signals).toEqual([]);
  });

  it('flags new_account_link_spam for a brand-new account posting a link-heavy message', async () => {
    const newAccount = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes old
    const result = await service.check(
      'user-1',
      'post',
      'post-1',
      'https://spam1.com https://spam2.com click now',
      newAccount,
    );
    expect(result.signals).toContain('new_account_link_spam');
  });

  it('does NOT flag link spam for an old account posting the same content', async () => {
    const oldAccount = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await service.check(
      'user-1',
      'post',
      'post-1',
      'https://spam1.com https://spam2.com click now',
      oldAccount,
    );
    expect(result.signals).not.toContain('new_account_link_spam');
  });

  it('flags high_velocity once a single user exceeds the per-minute threshold', async () => {
    const account = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    let lastResult;
    for (let i = 0; i < 10; i++) {
      lastResult = await service.check('user-1', 'post', `post-${i}`, `unique content number ${i}`, account);
    }
    expect(lastResult!.signals).toContain('high_velocity');
  });

  it('flags duplicate_content once the same exact text appears from enough distinct users', async () => {
    const account = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const text = 'this exact identical spam message appears everywhere';
    let lastResult;
    for (let i = 0; i < 6; i++) {
      lastResult = await service.check(`user-${i}`, 'post', `post-${i}`, text, account);
    }
    expect(lastResult!.signals).toContain('duplicate_content');
  });

  it('does not flag duplicate_content for short/trivial text (avoids false positives on common short reactions)', async () => {
    const account = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    let lastResult;
    for (let i = 0; i < 10; i++) {
      lastResult = await service.check(`user-${i}`, 'comment', `c-${i}`, '😂😂😂', account);
    }
    expect(lastResult!.signals).not.toContain('duplicate_content');
  });
});
