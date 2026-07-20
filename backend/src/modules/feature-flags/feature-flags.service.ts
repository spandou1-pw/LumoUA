import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { FeatureFlag } from './entities/feature-flag.entity';

const CACHE_TTL_MS = 30_000; // flags change rarely; short cache avoids a DB hit on every check

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag) private readonly flags: Repository<FeatureFlag>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async listAll(): Promise<FeatureFlag[]> {
    return this.flags.find({ order: { key: 'ASC' } });
  }

  async upsert(key: string, description: string, enabled: boolean, rolloutPercentage = 100): Promise<FeatureFlag> {
    await this.flags.upsert({ key, description, enabled, rolloutPercentage }, ['key']);
    await this.cache.del(`flag:${key}`);
    const flag = await this.flags.findOne({ where: { key } });
    return flag!;
  }

  /**
   * doc 42: deterministic percentage rollout — hash(userId + key) mod 100
   * compared against rolloutPercentage, so a given user always lands on
   * the same side of the rollout across requests (not re-randomized every
   * call, which would make the feature flicker on/off for them).
   */
  async isEnabledForUser(key: string, userId: string): Promise<boolean> {
    const cacheKey = `flag:${key}`;
    let flag = await this.cache.get<FeatureFlag>(cacheKey);
    if (!flag) {
      const found = await this.flags.findOne({ where: { key } });
      if (!found) return false; // doc: unknown flag defaults to off, never throws — callers shouldn't need to handle a missing-flag error just to check a flag
      flag = found;
      await this.cache.set(cacheKey, flag, CACHE_TTL_MS);
    }

    if (!flag.enabled) return false;
    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;

    const hash = crypto.createHash('md5').update(`${userId}:${key}`).digest('hex');
    const bucket = parseInt(hash.slice(0, 8), 16) % 100;
    return bucket < flag.rolloutPercentage;
  }
}
