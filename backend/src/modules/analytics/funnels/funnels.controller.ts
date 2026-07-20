import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PlatformRole } from '../../../common/enums/role.enum';
import { FunnelAnalyticsService } from './funnel-analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsEventsController {
  constructor(private readonly funnels: FunnelAnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track a generic analytics event (funnel step, etc.)' })
  async track(@CurrentUser('id') userId: string, @Body('eventName') eventName: string, @Body('properties') properties?: Record<string, unknown>) {
    await this.funnels.track(userId, eventName, properties);
    return { tracked: true };
  }
}

@ApiTags('Admin — Funnels')
@ApiBearerAuth()
@Controller('admin/funnels')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class FunnelsAdminController {
  constructor(private readonly funnels: FunnelAnalyticsService) {}

  @Post('compute')
  @ApiOperation({ summary: 'Compute step-by-step conversion for an ordered list of event names' })
  async compute(@Body('steps') steps: string[], @Query('days') days = 30) {
    return this.funnels.computeFunnel(steps, Number(days));
  }
}
