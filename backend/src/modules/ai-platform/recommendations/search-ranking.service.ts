import { Injectable } from '@nestjs/common';

export interface SearchCandidate {
  id: string;
  textMatchScore: number; // 0-1, from whatever text-matching engine ran (e.g. Elasticsearch's own relevance score, normalized)
  createdAt: Date;
  popularityScore: number; // e.g. follower count for a person, like count for a post — caller-normalized to 0-1
}

/**
 * doc AI.md "Search Ranking": this is a real, testable ranking function —
 * but doc 29 (Search Architecture) itself was flagged as "Not started"
 * back in Stage 5's own status report (blocked on standing up
 * Elasticsearch) and remains so; nothing in the backend currently calls
 * this service, because there's no live search endpoint to call it from.
 * It's built now, ready to plug in the moment doc 29's Elasticsearch
 * integration exists, rather than deferred and forgotten — but it should
 * not be read as "Search Ranking is done," only "the ranking formula
 * Search will use, once Search exists, is done."
 */
@Injectable()
export class SearchRankingService {
  private static readonly TEXT_MATCH_WEIGHT = 0.6;
  private static readonly POPULARITY_WEIGHT = 0.25;
  private static readonly RECENCY_WEIGHT = 0.15;
  private static readonly RECENCY_HALF_LIFE_DAYS = 30;

  static score(candidate: SearchCandidate, now: Date = new Date()): number {
    const ageDays = Math.max(0, (now.getTime() - candidate.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.exp((-Math.LN2 * ageDays) / this.RECENCY_HALF_LIFE_DAYS);

    return (
      candidate.textMatchScore * this.TEXT_MATCH_WEIGHT +
      candidate.popularityScore * this.POPULARITY_WEIGHT +
      recencyScore * this.RECENCY_WEIGHT
    );
  }

  static rank(candidates: SearchCandidate[], now: Date = new Date()): SearchCandidate[] {
    return [...candidates].sort((a, b) => this.score(b, now) - this.score(a, now));
  }
}
