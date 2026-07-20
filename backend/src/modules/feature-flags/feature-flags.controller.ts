import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Feature Flags')
@ApiBearerAuth()
@Controller('flags')
export class FeatureFlagsController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Check whether a flag is enabled for the current user (deterministic rollout)' })
  async check(@CurrentUser('id') userId: string, @Param('key') key: string) {
    return { key, enabled: await this.flagsService.isEnabledForUser(key, userId) };
  }
}

@ApiTags('Admin — Feature Flags')
@ApiBearerAuth()
@Controller('admin/flags')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class FeatureFlagsAdminController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'All feature flags' })
  async list() {
    return this.flagsService.listAll();
  }

  @Post(':key')
  @ApiOperation({ summary: 'Create or update a feature flag' })
  async upsert(
    @Param('key') key: string,
    @Body('description') description: string,
    @Body('enabled') enabled: boolean,
    @Body('rolloutPercentage') rolloutPercentage?: number,
  ) {
    return this.flagsService.upsert(key, description, enabled, rolloutPercentage);
  }
}
