import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PlatformRole } from '../../../common/enums/role.enum';
import { MissionsService } from './missions.service';
import { MissionDefinition, MissionPeriod } from './entities/mission-definition.entity';

@ApiTags('Missions')
@ApiBearerAuth()
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Active Daily/Weekly/Seasonal missions' })
  async list(@Query('period') period?: MissionPeriod) {
    return this.missionsService.listActive(period);
  }

  @Get('my-progress')
  @ApiOperation({ summary: "Current user's progress on every active mission this period" })
  async myProgress(@CurrentUser('id') userId: string) {
    return this.missionsService.myProgress(userId);
  }
}

@ApiTags('Admin — Missions')
@ApiBearerAuth()
@Controller('admin/missions')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class MissionsAdminController {
  constructor(@InjectRepository(MissionDefinition) private readonly definitions: Repository<MissionDefinition>) {}

  @Post()
  @ApiOperation({ summary: 'Create a mission definition' })
  async create(@Body() dto: Partial<MissionDefinition>) {
    return this.definitions.save(this.definitions.create(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or deactivate a mission' })
  async update(@Param('id') id: string, @Body() dto: Partial<MissionDefinition>) {
    await this.definitions.update({ id }, dto);
    return this.definitions.findOne({ where: { id } });
  }
}
