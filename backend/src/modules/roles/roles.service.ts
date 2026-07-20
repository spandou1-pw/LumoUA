import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PlatformRole } from '../../common/enums/role.enum';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

/**
 * doc 24: role changes are an admin-only action, always audit-logged
 * (NFR-SEC-4) — this is the single place role mutation happens so that
 * guarantee can't be bypassed by editing users directly from another module.
 */
@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  async assignRole(actorId: string, targetUserId: string, role: PlatformRole): Promise<User> {
    const user = await this.users.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const previousRole = user.role;
    user.role = role;
    const saved = await this.users.save(user);

    await this.auditLog.insert({
      actorId,
      action: 'ROLE_ASSIGNED',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { previousRole, newRole: role },
    });

    return saved;
  }
}
