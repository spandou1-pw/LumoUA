import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserStatus } from './entities/user.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

@ApiTags('Admin — Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(RolesGuard)
export class UsersAdminController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  @Get()
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Search/list users by username or email' })
  @ApiQuery({ name: 'q', required: false })
  async search(@Query('q') q?: string, @Query('limit') limit = 50) {
    const qb = this.users
      .createQueryBuilder('u')
      .select(['u.id', 'u.username', 'u.email', 'u.displayName', 'u.status', 'u.role', 'u.createdAt'])
      .orderBy('u.created_at', 'DESC')
      .limit(Number(limit));
    if (q) qb.andWhere('(u.username ILIKE :q OR u.email ILIKE :q)', { q: `%${q}%` });
    return qb.getMany();
  }

  @Get(':id')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
  @ApiOperation({ summary: 'User detail for support/moderation investigation' })
  async detail(@Param('id') id: string) {
    return this.users.findOne({ where: { id } });
  }

  /**
   * doc 24: changing platform status (suspend/ban) is admin-only — a
   * moderator can see the user (above) but not change their standing,
   * matching the same role split already established for Payments
   * (Stage 6), Wallet (Stage 9), and role assignment (Stage 4).
   */
  @Patch(':id/status')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Suspend, ban, or reactivate a user account (doc 04 ADMIN-1)' })
  async setStatus(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body('status') status: UserStatus,
    @Body('reason') reason: string,
  ) {
    await this.users.update({ id }, { status });
    await this.auditLog.insert({
      actorId,
      action: 'USER_STATUS_CHANGED',
      targetType: 'user',
      targetId: id,
      metadata: { newStatus: status, reason },
    });
    return this.users.findOne({ where: { id } });
  }
}
