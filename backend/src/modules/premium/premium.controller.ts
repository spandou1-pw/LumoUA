import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGeneral } from '../../common/decorators/rate-limit.decorator';
import { PremiumService } from './premium.service';
import { CosmeticsService } from './cosmetics.service';
import { ProfileExtrasService } from './profile-extras.service';
import { PremiumReactionsService } from './premium-reactions.service';
import { PremiumLimitsService } from './premium-limits.service';
import { CosmeticCategory } from './entities/cosmetic-item.entity';
import { ReactionTargetType } from './entities/premium-reaction.entity';
import { SelectCosmeticDto, UpdateProfileExtrasDto, ReactDto } from './dto/premium.dto';

@ApiTags('Premium')
@ApiBearerAuth()
@Controller('premium')
export class PremiumController {
  constructor(
    private readonly premium: PremiumService,
    private readonly cosmetics: CosmeticsService,
    private readonly profileExtras: ProfileExtrasService,
    private readonly reactions: PremiumReactionsService,
    private readonly limits: PremiumLimitsService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Is the current user premium right now (live subscription check)' })
  async status(@CurrentUser('id') userId: string) {
    return { isPremium: await this.premium.isPremium(userId) };
  }

  @Get('limits')
  @ApiOperation({ summary: 'Current limits for this user (differ for free vs premium)' })
  async limitsForMe(@CurrentUser('id') userId: string) {
    return this.limits.limitsFor(userId);
  }

  // ---------- Cosmetics: Badge/Frame/Theme/Username Color/Wallpaper/Profile Effect ----------

  @Get('cosmetics/:category/catalog')
  @ApiParam({ name: 'category' })
  @ApiQuery({ name: 'animatedOnly', required: false })
  @ApiOperation({ summary: 'Available items in a cosmetic category (Badge Selector and its siblings)' })
  async catalog(@Param('category') category: CosmeticCategory, @Query('animatedOnly') animatedOnly?: string) {
    return animatedOnly === 'true'
      ? this.cosmetics.listAnimatedCatalog(category)
      : this.cosmetics.listCatalog(category);
  }

  @Get('cosmetics/me')
  @ApiOperation({ summary: "Current user's active selection per category" })
  async mySelections(@CurrentUser('id') userId: string) {
    return this.cosmetics.getSelectionsForUser(userId);
  }

  @Post('cosmetics/select')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Select an active cosmetic item for a category (premium-gated per item)' })
  async select(@CurrentUser('id') userId: string, @Body() dto: SelectCosmeticDto) {
    return this.cosmetics.select(userId, dto.category, dto.cosmeticItemId);
  }

  @Delete('cosmetics/:category')
  @ApiOperation({ summary: 'Clear the selection for a category, reverting to default' })
  async clear(@CurrentUser('id') userId: string, @Param('category') category: CosmeticCategory) {
    await this.cosmetics.clearSelection(userId, category);
    return { cleared: true };
  }

  @Get('display/:userId')
  @ApiOperation({ summary: 'Badge + username color bundle for rendering beside a name (feed/profile/comments)' })
  async display(@Param('userId') userId: string) {
    return this.cosmetics.getDisplayBundle(userId);
  }

  // ---------- Profile extras: status, animated profile, video avatar ----------

  @Get('profile-extras/:userId')
  @ApiOperation({ summary: 'Public status/animated-profile/video-avatar display info for a user' })
  async getProfileExtras(@Param('userId') userId: string) {
    return this.profileExtras.getPublicDisplay(userId);
  }

  @Patch('profile-extras')
  @ApiOperation({ summary: 'Update status text/emoji, animated profile toggle, video avatar (premium required)' })
  async updateProfileExtras(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileExtrasDto) {
    return this.profileExtras.update(userId, dto);
  }

  // ---------- Premium reactions ----------

  @Get('reactions/allowed')
  @ApiOperation({ summary: 'Emoji available for premium reactions' })
  async allowedReactions() {
    return { emoji: this.reactions.listAllowedEmoji() };
  }

  @Post('reactions')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'React with a premium emoji reaction (premium required)' })
  async react(@CurrentUser('id') userId: string, @Body() dto: ReactDto) {
    await this.reactions.react(userId, dto.targetType, dto.targetId, dto.emoji);
    return { reacted: true };
  }

  @Delete('reactions')
  @ApiOperation({ summary: 'Remove your premium reaction from a target' })
  async removeReaction(
    @CurrentUser('id') userId: string,
    @Body('targetType') targetType: ReactionTargetType,
    @Body('targetId') targetId: string,
  ) {
    await this.reactions.remove(userId, targetType, targetId);
    return { reacted: false };
  }
}
