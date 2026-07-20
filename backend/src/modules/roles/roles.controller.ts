import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesService } from './roles.service';

@Controller('admin/users')
@UseGuards(RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Patch(':id/role')
  @Roles(PlatformRole.ADMIN) // doc 24: only admin, not moderator, can change roles
  async assignRole(
    @CurrentUser('id') actorId: string,
    @Param('id') targetUserId: string,
    @Body('role') role: PlatformRole,
  ) {
    return this.rolesService.assignRole(actorId, targetUserId, role);
  }
}
