import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

/**
 * doc 24 NFR-SEC-4 requires every moderator/admin action be audit-logged
 * — that write path has existed since Stage 4 (every admin controller
 * across Stages 6-10 inserts into this table). What never existed until
 * now is a way to actually *read* it back. Admin-only, not moderator —
 * the audit log itself is a sensitive record of who-did-what and
 * shouldn't have a wider read audience than strictly necessary.
 */
@ApiTags('Admin — Audit Log')
@ApiBearerAuth()
@Controller('admin/audit-log')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class AuditLogController {
  constructor(@InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>) {}

  @Get()
  @ApiOperation({ summary: 'Browse the admin audit log, filterable by actor/action/target' })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async browse(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit = 100,
  ) {
    const qb = this.auditLog.createQueryBuilder('a').orderBy('a.created_at', 'DESC').limit(Number(limit));
    if (actorId) qb.andWhere('a.actor_id = :actorId', { actorId });
    if (action) qb.andWhere('a.action = :action', { action });
    if (targetType) qb.andWhere('a.target_type = :targetType', { targetType });
    return qb.getMany();
  }
}
