import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

const CACHE_TTL_MS = 60_000;

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(SystemConfiguration) private readonly config: Repository<SystemConfiguration>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async get<T = unknown>(key: string, fallback: T): Promise<T> {
    const cached = await this.cache.get<T>(`config:${key}`);
    if (cached !== undefined && cached !== null) return cached;

    const row = await this.config.findOne({ where: { key } });
    if (!row) return fallback;
    await this.cache.set(`config:${key}`, row.value, CACHE_TTL_MS);
    return row.value as T;
  }

  async listAll(): Promise<SystemConfiguration[]> {
    return this.config.find({ order: { key: 'ASC' } });
  }

  async set(key: string, value: any, description: string | undefined, actorId: string): Promise<SystemConfiguration> {
    await this.config.upsert({ key, value, description: description ?? null, updatedBy: actorId }, ['key']);
    await this.cache.del(`config:${key}`);

    await this.auditLog.insert({
      actorId,
      action: 'CONFIG_UPDATED',
      targetType: 'system_configuration',
      targetId: null,
      metadata: { key, value },
    });

    return (await this.config.findOne({ where: { key } }))!;
  }
}
