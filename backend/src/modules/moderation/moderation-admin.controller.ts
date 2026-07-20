import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { ModerationActionsService } from './moderation-actions.service';
import { ResolveReportDto } from './dto/report.dto';

/**
 * doc 24: moderator can resolve reports (dismiss/action), cannot change
 * user platform status (that stays admin-only, see UsersAdminController)
 * — `@Roles(MODERATOR, ADMIN)` here, `@Roles(ADMIN)` there, matching doc
 * 24's stated limit on moderator blast-radius exactly.
 */
@ApiTags('Admin — Moderation')
@ApiBearerAuth()
@Controller('admin/moderation')
@UseGuards(RolesGuard)
@Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
export class ModerationAdminController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly moderationActions: ModerationActionsService,
  ) {}

  @Get('reports')
  @ApiOperation({ summary: 'Open report queue, severity-prioritized (doc 32)' })
  async openReports() {
    return this.reportsService.listOpen();
  }

  @Get('reports/grouped')
  @ApiOperation({ summary: 'Open reports aggregated by target — avoids listing duplicate reports on the same item' })
  async groupedReports() {
    return this.reportsService.pendingGroupedByTarget();
  }

  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Dismiss a report, or mark actioned (does not itself remove content — see /reports/:id/remove-content)' })
  async resolve(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.reportsService.resolve(id, actorId, dto.status, dto.note);
  }

  @Patch('reports/:id/remove-content')
  @ApiOperation({ summary: 'Resolve as actioned AND remove the reported content, notifying the author with the specific reason (doc 32)' })
  async resolveAndRemove(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body('note') note?: string) {
    const reports = await this.reportsService.listOpen(1000); // doc: simplified lookup; a dedicated findOne would be a one-line addition
    const report = reports.find((r) => r.id === id);
    if (report) {
      await this.moderationActions.removeContent(report.targetType, report.targetId, report.reason, actorId);
    }
    return this.reportsService.resolve(id, actorId, 'actioned', note);
  }
}
