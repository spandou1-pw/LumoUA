import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';

const processStartedAt = Date.now();

/**
 * doc ADMIN.md "System Health": every check here does a real round trip —
 * `SELECT 1` against the actual Postgres connection pool, a real
 * set/get/delete against the actual Redis-backed cache — never a
 * hardcoded `{ status: 'ok' }` pretending to have checked something.
 * A check that silently always reports healthy is worse than no check at
 * all, since it actively hides real outages from whoever's looking at it.
 */
@ApiTags('Admin — System Health')
@ApiBearerAuth()
@Controller('admin/system-health')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class SystemHealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Live connectivity check for Postgres and Redis, plus process uptime' })
  async check() {
    const [database, redis] = await Promise.allSettled([this.checkDatabase(), this.checkRedis()]);

    return {
      status: database.status === 'fulfilled' && redis.status === 'fulfilled' ? 'healthy' : 'degraded',
      uptimeSeconds: Math.floor((Date.now() - processStartedAt) / 1000),
      checks: {
        database: database.status === 'fulfilled' ? database.value : { ok: false, error: (database as PromiseRejectedResult).reason?.message },
        redis: redis.status === 'fulfilled' ? redis.value : { ok: false, error: (redis as PromiseRejectedResult).reason?.message },
      },
    };
  }

  private async checkDatabase(): Promise<{ ok: true; latencyMs: number }> {
    const start = Date.now();
    await this.dataSource.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  }

  private async checkRedis(): Promise<{ ok: true; latencyMs: number }> {
    const start = Date.now();
    const probeKey = `health-check:${Date.now()}`;
    await this.cache.set(probeKey, '1', 5000);
    const value = await this.cache.get(probeKey);
    await this.cache.del(probeKey);
    if (value !== '1') throw new Error('Redis round-trip returned an unexpected value');
    return { ok: true, latencyMs: Date.now() - start };
  }
}
