import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CosmeticItem, CosmeticCategory } from './entities/cosmetic-item.entity';
import { PremiumAssetPack, AssetPackType } from './entities/premium-asset-pack.entity';
import { PremiumAnalyticsService } from './premium-analytics.service';
import { CreateCosmeticItemDto } from './dto/premium.dto';

@ApiTags('Admin — Premium')
@ApiBearerAuth()
@Controller('admin/premium')
@UseGuards(RolesGuard)
@Roles(PlatformRole.ADMIN)
export class PremiumAdminController {
  constructor(
    @InjectRepository(CosmeticItem) private readonly cosmeticItems: Repository<CosmeticItem>,
    @InjectRepository(PremiumAssetPack) private readonly assetPacks: Repository<PremiumAssetPack>,
    private readonly analytics: PremiumAnalyticsService,
  ) {}

  // ---------- Cosmetic catalog management ----------

  @Post('cosmetics')
  @ApiOperation({ summary: 'Add a new cosmetic item to a category catalog' })
  async createCosmetic(@Body() dto: CreateCosmeticItemDto) {
    return this.cosmeticItems.save(this.cosmeticItems.create(dto));
  }

  @Patch('cosmetics/:id')
  @ApiOperation({ summary: 'Update or deactivate a cosmetic item' })
  async updateCosmetic(@Param('id') id: string, @Body() dto: Partial<CreateCosmeticItemDto & { active: boolean; sortOrder: number }>) {
    await this.cosmeticItems.update({ id }, dto);
    return this.cosmeticItems.findOne({ where: { id } });
  }

  @Delete('cosmetics/:id')
  @ApiOperation({ summary: 'Deactivate a cosmetic item (soft — existing selections keep working until manually cleared)' })
  async deactivateCosmetic(@Param('id') id: string) {
    await this.cosmeticItems.update({ id }, { active: false });
    return { deactivated: true };
  }

  // ---------- Emoji/sticker packs ----------

  @Get('asset-packs')
  @ApiOperation({ summary: 'All emoji/sticker packs' })
  async listAssetPacks(@Query('type') type?: AssetPackType) {
    return type ? this.assetPacks.find({ where: { type } }) : this.assetPacks.find();
  }

  @Post('asset-packs')
  @ApiOperation({ summary: 'Create an emoji or sticker pack' })
  async createAssetPack(@Body() dto: { type: AssetPackType; name: string; coverUrl?: string; items: PremiumAssetPack['items'] }) {
    return this.assetPacks.save(this.assetPacks.create(dto));
  }

  @Patch('asset-packs/:id')
  @ApiOperation({ summary: 'Update or deactivate an emoji/sticker pack' })
  async updateAssetPack(@Param('id') id: string, @Body() dto: Partial<{ name: string; coverUrl: string; items: PremiumAssetPack['items']; active: boolean }>) {
    await this.assetPacks.update({ id }, dto);
    return this.assetPacks.findOne({ where: { id } });
  }

  // ---------- Analytics ----------

  @Get('analytics/popular-cosmetics/:category')
  @ApiOperation({ summary: 'Most-selected cosmetics for a category' })
  async popularCosmetics(@Param('category') category: CosmeticCategory) {
    return this.analytics.mostPopularCosmetics(category);
  }

  @Get('analytics/adoption')
  @ApiOperation({ summary: 'Cosmetic adoption rate among active subscribers' })
  async adoption() {
    return this.analytics.cosmeticAdoptionRate();
  }

  @Get('analytics/reaction-usage')
  @ApiOperation({ summary: 'Premium reaction emoji usage over the trailing N days' })
  async reactionUsage(@Query('days') days = 30) {
    return this.analytics.premiumReactionUsage(Number(days));
  }
}
