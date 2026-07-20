import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Admin — Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Cross-domain platform overview — users, revenue, subscriptions, gifts, moderation queue' })
  async overview() {
    return this.dashboardService.overview();
  }
}
