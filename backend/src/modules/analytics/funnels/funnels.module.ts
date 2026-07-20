import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { FunnelAnalyticsService } from './funnel-analytics.service';
import { AnalyticsEventsController, FunnelsAdminController } from './funnels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [AnalyticsEventsController, FunnelsAdminController],
  providers: [FunnelAnalyticsService],
  exports: [FunnelAnalyticsService],
})
export class FunnelsModule {}
