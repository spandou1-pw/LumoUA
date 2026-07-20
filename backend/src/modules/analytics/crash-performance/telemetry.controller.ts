import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PlatformRole } from '../../../common/enums/role.enum';
import { CrashPerformanceService } from './crash-performance.service';

@ApiTags('Crash & Performance')
@ApiBearerAuth()
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly service: CrashPerformanceService) {}

  @Post('crash')
  @ApiOperation({ summary: 'Report a client crash (doc GROWTH.md — ingestion endpoint; client SDK integration is separate)' })
  async reportCrash(
    @CurrentUser('id') userId: string,
    @Body('platform') platform: 'ios' | 'android' | 'web' | 'desktop',
    @Body('appVersion') appVersion: string,
    @Body('message') message: string,
    @Body('stackTrace') stackTrace?: string,
  ) {
    await this.service.reportCrash({ userId, platform, appVersion, message, stackTrace: stackTrace ?? null });
    return { reported: true };
  }

  @Post('performance')
  @ApiOperation({ summary: 'Report a client performance measurement (cold start, screen load, etc.)' })
  async reportPerformance(
    @CurrentUser('id') userId: string,
    @Body('platform') platform: 'ios' | 'android' | 'web' | 'desktop',
    @Body('metricName') metricName: string,
    @Body('durationMs') durationMs: number,
  ) {
    await this.service.reportPerformanceMetric({ userId, platform, metricName, durationMs });
    return { reported: true };
  }
}

@ApiTags('Admin — Crash & Performance')
@ApiBearerAuth()
@Controller('admin/telemetry')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class TelemetryAdminController {
  constructor(private readonly service: CrashPerformanceService) {}

  @Get('crash-rate')
  @ApiOperation({ summary: 'Crash count by app version/platform' })
  async crashRate(@Query('days') days = 7) {
    return this.service.crashRateByVersion(Number(days));
  }

  @Get('performance')
  @ApiOperation({ summary: 'p50/p95/p99 for a named performance metric (doc 05 NFR targets)' })
  async performance(@Query('metricName') metricName: string, @Query('platform') platform?: string, @Query('days') days = 7) {
    return this.service.performancePercentiles(metricName, platform, Number(days));
  }
}
