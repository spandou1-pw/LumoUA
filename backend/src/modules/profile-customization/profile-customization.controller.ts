import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProfileCustomizationService } from './profile-customization.service';
import { AchievementsService } from './achievements.service';
import { BadgeShowcaseService } from './badge-showcase.service';
import { AchievementShowcaseService } from './achievement-showcase.service';

/**
 * Route order matters here: NestJS matches routes in declaration order, and
 * `:userId` would otherwise greedily swallow `/achievements/catalog` etc.
 * (treating "achievements" as a userId value) if it were declared first.
 * Every static-prefixed route below is declared before the `:userId`
 * catch-all at the bottom for exactly this reason.
 */
@ApiTags('Profile Customization')
@ApiBearerAuth()
@Controller('profile-customization')
export class ProfileCustomizationController {
  constructor(
    private readonly profileCustomization: ProfileCustomizationService,
    private readonly achievements: AchievementsService,
    private readonly badgeShowcase: BadgeShowcaseService,
    private readonly achievementShowcase: AchievementShowcaseService,
  ) {}

  // ---------- Achievements ----------

  @Get('achievements/catalog')
  @ApiOperation({ summary: 'All available achievements' })
  async achievementCatalog() {
    return this.achievements.listCatalog();
  }

  @Get('achievements/me')
  @ApiOperation({ summary: 'Achievements earned by the current user' })
  async myAchievements(@CurrentUser('id') userId: string) {
    return this.achievements.listEarnedForUser(userId);
  }

  @Get('achievements/:userId')
  @ApiOperation({ summary: "Another user's earned achievements" })
  async userAchievements(@Param('userId') userId: string) {
    return this.achievements.listEarnedForUser(userId);
  }

  // ---------- Badge Showcase ----------

  @Get('badge-showcase/:userId')
  @ApiOperation({ summary: 'Badge Showcase — featured badges on a profile' })
  async badgeShowcaseFor(@Param('userId') userId: string) {
    return this.badgeShowcase.getShowcase(userId);
  }

  @Post('badge-showcase/:position')
  @ApiOperation({ summary: 'Feature a badge in a showcase slot' })
  async setBadgeShowcase(
    @CurrentUser('id') userId: string,
    @Param('position') position: string,
    @Body('cosmeticItemId') cosmeticItemId: string,
  ) {
    return this.badgeShowcase.setSlot(userId, Number(position), cosmeticItemId);
  }

  @Delete('badge-showcase/:position')
  @ApiOperation({ summary: 'Clear a badge showcase slot' })
  async clearBadgeShowcase(@CurrentUser('id') userId: string, @Param('position') position: string) {
    await this.badgeShowcase.clearSlot(userId, Number(position));
    return { cleared: true };
  }

  // ---------- Achievement Showcase ----------

  @Get('achievement-showcase/:userId')
  @ApiOperation({ summary: 'Achievements Showcase — featured achievements on a profile' })
  async achievementShowcaseFor(@Param('userId') userId: string) {
    return this.achievementShowcase.getShowcase(userId);
  }

  @Post('achievement-showcase/:position')
  @ApiOperation({ summary: 'Feature an earned achievement in a showcase slot' })
  async setAchievementShowcase(
    @CurrentUser('id') userId: string,
    @Param('position') position: string,
    @Body('achievementId') achievementId: string,
  ) {
    return this.achievementShowcase.setSlot(userId, Number(position), achievementId);
  }

  @Delete('achievement-showcase/:position')
  @ApiOperation({ summary: 'Clear an achievement showcase slot' })
  async clearAchievementShowcase(@CurrentUser('id') userId: string, @Param('position') position: string) {
    await this.achievementShowcase.clearSlot(userId, Number(position));
    return { cleared: true };
  }

  // ---------- Full aggregate display (catch-all — MUST be last) ----------

  @Get(':userId')
  @ApiOperation({ summary: 'Premium Showcase — full profile customization display in one call' })
  async fullDisplay(@Param('userId') userId: string) {
    return this.profileCustomization.getFullDisplay(userId);
  }
}
