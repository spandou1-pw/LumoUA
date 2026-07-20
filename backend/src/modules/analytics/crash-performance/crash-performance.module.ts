import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrashReport } from './entities/crash-report.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { CrashPerformanceService } from './crash-performance.service';
import { TelemetryController, TelemetryAdminController } from './telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CrashReport, PerformanceMetric])],
  controllers: [TelemetryController, TelemetryAdminController],
  providers: [CrashPerformanceService],
})
export class CrashPerformanceModule {}
