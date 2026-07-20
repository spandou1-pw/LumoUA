import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PlatformRole } from '../../../common/enums/role.enum';
import { AbTestingService } from './ab-testing.service';
import { Experiment } from './entities/experiment.entity';

@ApiTags('A/B Testing')
@ApiBearerAuth()
@Controller('experiments')
export class AbTestingController {
  constructor(private readonly abTesting: AbTestingService) {}

  @Get(':key/assignment')
  @ApiOperation({ summary: 'Get (and log exposure for) your variant assignment' })
  async assignment(@CurrentUser('id') userId: string, @Param('key') key: string) {
    const variantKey = await this.abTesting.getAssignment(userId, key);
    return { variantKey };
  }

  @Post(':key/convert')
  @ApiOperation({ summary: 'Log a conversion event for this experiment' })
  async convert(@CurrentUser('id') userId: string, @Param('key') key: string, @Body('goal') goal: string) {
    await this.abTesting.logConversion(userId, key, goal);
    return { logged: true };
  }
}

@ApiTags('Admin — A/B Testing')
@ApiBearerAuth()
@Controller('admin/experiments')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class AbTestingAdminController {
  constructor(
    @InjectRepository(Experiment) private readonly experiments: Repository<Experiment>,
    private readonly abTesting: AbTestingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an experiment' })
  async create(@Body() dto: Partial<Experiment>) {
    return this.experiments.save(this.experiments.create(dto));
  }

  @Get(':key/results')
  @ApiOperation({ summary: 'Per-variant exposure/conversion counts and rates (no significance testing — see doc GROWTH.md)' })
  async results(@Param('key') key: string) {
    return this.abTesting.results(key);
  }
}
