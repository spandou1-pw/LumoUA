import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { SpamSignal, SpamSignalType } from './entities/spam-signal.entity';

const DUPLICATE_CONTENT_WINDOW_SECONDS = 3600;
const DUPLICATE_CONTENT_DISTINCT_USER_THRESHOLD = 5; // same exact text from 5+ different accounts within the hour
const VELOCITY_WINDOW_SECONDS = 60;
const VELOCITY_THRESHOLD = 8; // 8+ posts/comments in a minute from one account
const NEW_ACCOUNT_THRESHOLD_HOURS = 24;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

export interface SpamCheckResult {
  isSuspicious: boolean;
  signals: SpamSignalType[];
}

/**
 * doc 04 MOD-3: "rate-limit-based heuristics (e.g. identical content
 * posted rapidly across many accounts, new-account link-spam patterns)
 * auto-flag to the queue, don't auto-remove." Every heuristic below is
 * real and deterministic — no model, no external dependency, fully unit
 * testable (see test/unit/spam-detection.service.spec.ts).
 */
@Injectable()
export class SpamDetectionService {
  constructor(
    @InjectRepository(SpamSignal) private readonly signals: Repository<SpamSignal>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  static normalizeContentHash(text: string): string {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  static linkDensity(text: string): number {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;
    const urlMatches = text.match(URL_PATTERN) ?? [];
    return urlMatches.length / words.length;
  }

  async check(
    userId: string,
    targetType: string,
    targetId: string,
    text: string,
    accountCreatedAt: Date,
  ): Promise<SpamCheckResult> {
    const triggered: SpamSignalType[] = [];

    if (await this.checkDuplicateContent(userId, text)) triggered.push('duplicate_content');
    if (await this.checkVelocity(userId)) triggered.push('high_velocity');
    if (this.checkNewAccountLinkSpam(text, accountCreatedAt)) triggered.push('new_account_link_spam');

    for (const signalType of triggered) {
      await this.signals.save(
        this.signals.create({ userId, targetType, targetId, signalType, details: null }),
      );
    }

    return { isSuspicious: triggered.length > 0, signals: triggered };
  }

  private async checkDuplicateContent(userId: string, text: string): Promise<boolean> {
    if (text.trim().length < 10) return false; // too short for exact-duplicate matching to be meaningful (avoids false positives on "😂" etc.)

    const hash = SpamDetectionService.normalizeContentHash(text);
    const key = `spam:dup:${hash}`;
    const seenUsers = (await this.cache.get<string[]>(key)) ?? [];

    if (!seenUsers.includes(userId)) {
      seenUsers.push(userId);
      await this.cache.set(key, seenUsers, DUPLICATE_CONTENT_WINDOW_SECONDS * 1000);
    }

    return seenUsers.length >= DUPLICATE_CONTENT_DISTINCT_USER_THRESHOLD;
  }

  private async checkVelocity(userId: string): Promise<boolean> {
    const key = `spam:velocity:${userId}`;
    const count = ((await this.cache.get<number>(key)) ?? 0) + 1;
    await this.cache.set(key, count, VELOCITY_WINDOW_SECONDS * 1000);
    return count > VELOCITY_THRESHOLD;
  }

  private checkNewAccountLinkSpam(text: string, accountCreatedAt: Date): boolean {
    const accountAgeHours = (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60);
    if (accountAgeHours > NEW_ACCOUNT_THRESHOLD_HOURS) return false;
    return SpamDetectionService.linkDensity(text) > 0.15; // more than ~1 link per 6-7 words from a brand-new account
  }
}
