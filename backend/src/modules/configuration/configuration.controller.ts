import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfigurationService } from './configuration.service';

@ApiTags('Admin — Configuration')
@ApiBearerAuth()
@Controller('admin/configuration')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class ConfigurationAdminController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'All platform configuration values' })
  async list() {
    return this.configService.listAll();
  }

  @Post(':key')
  @ApiOperation({ summary: 'Set a configuration value (audit-logged, doc 24 NFR-SEC-4)' })
  async set(
    @CurrentUser('id') actorId: string,
    @Param('key') key: string,
    @Body('value') value: unknown,
    @Body('description') description?: string,
  ) {
    return this.configService.set(key, value, description, actorId);
  }
}
