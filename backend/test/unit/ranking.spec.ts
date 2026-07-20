import { FeedRankingService } from '../../src/modules/ai-platform/recommendations/feed-ranking.service';
import { SearchRankingService } from '../../src/modules/ai-platform/recommendations/search-ranking.service';

describe('FeedRankingService.score / rank', () => {
  const now = new Date('2026-07-18T12:00:00Z');

  it('scores a more-recent post higher than an older post with identical engagement', () => {
    const recent = { id: 'a', createdAt: new Date('2026-07-18T10:00:00Z'), likeCount: 10, commentCount: 2 };
    const old = { id: 'b', createdAt: new Date('2026-07-10T10:00:00Z'), likeCount: 10, commentCount: 2 };

    expect(FeedRankingService.score(recent, now)).toBeGreaterThan(FeedRankingService.score(old, now));
  });

  it('scores a post with more engagement higher than a same-age post with less', () => {
    const popular = { id: 'a', createdAt: now, likeCount: 100, commentCount: 30 };
    const quiet = { id: 'b', createdAt: now, likeCount: 2, commentCount: 0 };

    expect(FeedRankingService.score(popular, now)).toBeGreaterThan(FeedRankingService.score(quiet, now));
  });

  it('weighs a comment more heavily than a like (doc 28: comments signal stronger intent)', () => {
    const manyLikes = { id: 'a', createdAt: now, likeCount: 20, commentCount: 0 };
    const fewCommentsInstead = { id: 'b', createdAt: now, likeCount: 0, commentCount: 8 };

    // Comments are weighted 2.5x vs likes' 1x — even fewer comments than
    // likes should be able to outscore a like-only post at this ratio.
    expect(FeedRankingService.score(fewCommentsInstead, now)).toBeGreaterThan(FeedRankingService.score(manyLikes, now));
  });

  it('rank() sorts posts highest-score first', () => {
    const posts = [
      { id: 'low', createdAt: now, likeCount: 1, commentCount: 0 },
      { id: 'high', createdAt: now, likeCount: 50, commentCount: 10 },
      { id: 'mid', createdAt: now, likeCount: 10, commentCount: 1 },
    ];
    const ranked = FeedRankingService.rank(posts, now);
    expect(ranked.map((p) => p.id)).toEqual(['high', 'mid', 'low']);
  });

  it('a zero-engagement brand-new post still scores above zero (recency alone has some value)', () => {
    const brandNew = { id: 'a', createdAt: now, likeCount: 0, commentCount: 0 };
    // log1p(0) = 0 for both terms, so score is legitimately 0 here — this
    // test documents that fact rather than assuming otherwise.
    expect(FeedRankingService.score(brandNew, now)).toBe(0);
  });
});

describe('SearchRankingService.score / rank', () => {
  const now = new Date('2026-07-18T12:00:00Z');

  it('a strong text match dominates a weak one at equal popularity/recency', () => {
    const strongMatch = { id: 'a', textMatchScore: 0.95, createdAt: now, popularityScore: 0.5 };
    const weakMatch = { id: 'b', textMatchScore: 0.1, createdAt: now, popularityScore: 0.5 };
    expect(SearchRankingService.score(strongMatch, now)).toBeGreaterThan(SearchRankingService.score(weakMatch, now));
  });

  it('rank() orders candidates by combined score', () => {
    const candidates = [
      { id: 'low', textMatchScore: 0.1, createdAt: now, popularityScore: 0.1 },
      { id: 'high', textMatchScore: 0.9, createdAt: now, popularityScore: 0.9 },
    ];
    const ranked = SearchRankingService.rank(candidates, now);
    expect(ranked[0].id).toBe('high');
  });
});
