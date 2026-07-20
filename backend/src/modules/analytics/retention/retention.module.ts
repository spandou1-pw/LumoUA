import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { RetentionAnalyticsService } from './retention-analytics.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PlatformRole } from '../../../common/enums/role.enum';

@ApiTags('Admin — Retention')
@ApiBearerAuth()
@Controller('admin/retention')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class RetentionAdminController {
  constructor(private readonly retention: RetentionAnalyticsService) {}

  @Get('cohorts')
  @ApiOperation({ summary: 'D1/D7/D30 cohort retention (doc GROWTH.md)' })
  async cohorts(@Query('days') days = 30) {
    return this.retention.cohortRetention(Number(days));
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken])],
  controllers: [RetentionAdminController],
  providers: [RetentionAnalyticsService],
})
export class RetentionModule {}
