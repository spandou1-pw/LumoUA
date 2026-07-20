import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

/**
 * doc ADMIN.md "Security": admin-triggered account containment — the
 * emergency "something is wrong with this account, cut off every active
 * session right now" action. Reuses AuthService.logoutAllDevices (doc 23,
 * originally built for a user's own "log out everywhere" button) rather
 * than a separate implementation, since the underlying operation (revoke
 * every refresh token for a user) is identical regardless of who
 * triggered it — only the audit trail differs.
 */
@ApiTags('Admin — Security')
@ApiBearerAuth()
@Controller('admin/security')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class SecurityAdminController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  @Post(':userId/force-logout')
  @ApiOperation({ summary: 'Revoke every active session for a user — emergency account containment' })
  async forceLogout(@CurrentUser('id') actorId: string, @Param('userId') userId: string) {
    await this.authService.logoutAllDevices(userId);
    await this.auditLog.insert({
      actorId,
      action: 'ADMIN_FORCE_LOGOUT',
      targetType: 'user',
      targetId: userId,
    });
    return { loggedOutEverywhere: true };
  }
}
