import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { Achievement } from './entities/achievement.entity';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto, GrantAchievementDto } from './dto/profile-customization.dto';

@ApiTags('Admin — Profile Customization')
@ApiBearerAuth()
@Controller('admin/profile-customization')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class ProfileCustomizationAdminController {
  constructor(
    @InjectRepository(Achievement) private readonly achievements: Repository<Achievement>,
    private readonly achievementsService: AchievementsService,
  ) {}

  @Post('achievements')
  @ApiOperation({ summary: 'Add a new achievement to the catalog' })
  async createAchievement(@Body() dto: CreateAchievementDto) {
    return this.achievements.save(this.achievements.create(dto));
  }

  @Patch('achievements/:id')
  @ApiOperation({ summary: 'Update or deactivate an achievement' })
  async updateAchievement(@Param('id') id: string, @Body() dto: Partial<CreateAchievementDto & { active: boolean }>) {
    await this.achievements.update({ id }, dto);
    return this.achievements.findOne({ where: { id } });
  }

  @Post('achievements/grant')
  @ApiOperation({ summary: 'Manually grant an achievement (support/ops correction, or a stand-in until automated triggers are wired — see doc PROFILE.md)' })
  async grant(@Body() dto: GrantAchievementDto) {
    return this.achievementsService.grant(dto.userId, dto.achievementKey);
  }
}
