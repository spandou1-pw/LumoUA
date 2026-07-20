import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SafetyFilterTerm } from './entities/safety-filter-term.entity';

const CACHE_KEY = 'safety-filter-terms:active';
const CACHE_TTL_MS = 60_000;

export interface FilterHit {
  category: SafetyFilterTerm['category'];
  severity: number;
  matchedPattern: string;
}

/**
 * doc 33/AI.md: this is the ONE moderation layer in this platform that has
 * zero external dependency and runs synchronously — every other
 * classifier (text/image/video) is best-effort and async. Content
 * containing a high-severity match can be surfaced for review immediately
 * even if the deeper AI classifier is unconfigured or down, which matters
 * most for `self_harm`/`illegal_content` categories where any review
 * delay is the thing doc 32 explicitly designs against.
 */
@Injectable()
export class SafetyFiltersService {
  constructor(
    @InjectRepository(SafetyFilterTerm) private readonly terms: Repository<SafetyFilterTerm>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private async getActiveTerms(): Promise<SafetyFilterTerm[]> {
    const cached = await this.cache.get<SafetyFilterTerm[]>(CACHE_KEY);
    if (cached) return cached;
    const terms = await this.terms.find({ where: { active: true } });
    await this.cache.set(CACHE_KEY, terms, CACHE_TTL_MS);
    return terms;
  }

  /** Returns the highest-severity match, or null if the text is clean against the current list. */
  async check(text: string): Promise<FilterHit | null> {
    const terms = await this.getActiveTerms();
    if (terms.length === 0) return null;

    const normalized = text.toLowerCase();
    let best: FilterHit | null = null;

    for (const term of terms) {
      const matched = term.isRegex
        ? this.safeRegexTest(term.pattern, normalized)
        : normalized.includes(term.pattern.toLowerCase());

      if (matched && (!best || term.severity > best.severity)) {
        best = { category: term.category, severity: term.severity, matchedPattern: term.pattern };
      }
    }

    return best;
  }

  /** Admin-supplied regex is never trusted blindly — a pathological pattern (ReDoS) must not be able to hang the process. */
  private safeRegexTest(pattern: string, text: string): boolean {
    try {
      // doc: a real production hardening would run this in a worker with a
      // hard timeout (isolated-vm or a dedicated regex-safety library);
      // length-bounding the input here is a cheap first-line mitigation,
      // not a complete ReDoS defense — flagged in AI.md, not assumed solved.
      const bounded = text.slice(0, 5000);
      return new RegExp(pattern, 'i').test(bounded);
    } catch {
      return false; // an invalid pattern fails closed (no match), never throws into the caller
    }
  }

  async invalidateCache(): Promise<void> {
    await this.cache.del(CACHE_KEY);
  }
}
