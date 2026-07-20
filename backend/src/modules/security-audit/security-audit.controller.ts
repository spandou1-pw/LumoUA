import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { SecurityAuditService } from './security-audit.service';

@ApiTags('Admin — Security Audit')
@ApiBearerAuth()
@Controller('admin/security-audit')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class SecurityAuditController {
  constructor(private readonly auditService: SecurityAuditService) {}

  @Get()
  @ApiOperation({ summary: 'Run the runtime security configuration audit (doc SECURITY.md)' })
  async run() {
    const findings = this.auditService.runAudit();
    return { healthy: this.auditService.isHealthy(findings), findings };
  }
}
