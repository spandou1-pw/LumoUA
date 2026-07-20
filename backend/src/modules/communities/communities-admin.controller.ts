import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Community } from './entities/community.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

/**
 * doc 24: this is platform-level oversight (the platform admin's power
 * over any community), distinct from `CommunitiesService`'s
 * owner/moderator role scoping within a single community (Stage 4/24
 * "Future: Community Roles") — a platform admin can deactivate any
 * community; a community moderator's power stops at their own community's
 * boundary, unchanged from Stage 4.
 */
@ApiTags('Admin — Communities')
@ApiBearerAuth()
@Controller('admin/communities')
@UseGuards(RolesGuard)
export class CommunitiesAdminController {
  constructor(
    @InjectRepository(Community) private readonly communities: Repository<Community>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  @Get()
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
  @ApiOperation({ summary: 'All communities, platform-wide' })
  async list() {
    return this.communities.find({ order: { createdAt: 'DESC' } });
  }

  @Patch(':id/deactivate')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Platform-level deactivation of a community (e.g. persistent policy violations)' })
  async deactivate(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body('reason') reason: string) {
    // doc: modeled as visibility flip to 'private' + a platform flag would
    // need a schema field this Stage doesn't add speculatively — for now,
    // deactivation is recorded via the audit log as the authoritative
    // record of the action while the community's own visibility/active
    // state is set to private, immediately reducing its discoverability;
    // full removal/hard-deactivation semantics are a product decision to
    // finalize before this ships for real (flagged in ADMIN.md, not
    // silently assumed).
    await this.communities.update({ id }, { visibility: 'private' });
    await this.auditLog.insert({
      actorId,
      action: 'COMMUNITY_DEACTIVATED',
      targetType: 'community',
      targetId: id,
      metadata: { reason },
    });
    return { deactivated: true };
  }
}
