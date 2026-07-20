import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGeneral } from '../../common/decorators/rate-limit.decorator';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @RateLimitGeneral()
  @ApiOperation({ summary: 'File a report (doc 32) — post, comment, user, message, community, or gift' })
  async file(@CurrentUser('id') reporterId: string, @Body() dto: CreateReportDto) {
    const report = await this.reportsService.file(reporterId, dto.targetType, dto.targetId, dto.reason, dto.detail);
    // doc 32: confirmation without over-promising a specific outcome/timeline
    return { id: report.id, status: report.status, filedAt: report.createdAt };
  }

  @Get('mine')
  @ApiOperation({ summary: 'Reports filed by the current user' })
  async mine(@CurrentUser('id') userId: string) {
    return this.reportsService.myReports(userId);
  }
}
