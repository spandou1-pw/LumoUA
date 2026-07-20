import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlatformRole } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GiftCatalogItem } from './entities/gift-catalog-item.entity';
import { GiftCategory } from './entities/gift-category.entity';
import { GiftModerationService } from './gift-moderation.service';
import { GiftAnalyticsService } from './gift-analytics.service';
import { CreateGiftCatalogItemDto, CreateGiftCategoryDto } from './dto/gift-admin.dto';

@ApiTags('Admin — Gifts')
@ApiBearerAuth()
@Controller('admin/gifts')
@UseGuards(RolesGuard)
export class GiftAdminController {
  constructor(
    @InjectRepository(GiftCatalogItem) private readonly catalogItems: Repository<GiftCatalogItem>,
    @InjectRepository(GiftCategory) private readonly categories: Repository<GiftCategory>,
    private readonly moderation: GiftModerationService,
    private readonly analytics: GiftAnalyticsService,
  ) {}

  // ---------- Gift Administration: categories & catalog ----------

  @Post('categories')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Create a Gift Category' })
  async createCategory(@Body() dto: CreateGiftCategoryDto) {
    return this.categories.save(this.categories.create(dto));
  }

  @Patch('categories/:id')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Update or deactivate a Gift Category' })
  async updateCategory(@Param('id') id: string, @Body() dto: Partial<CreateGiftCategoryDto & { active: boolean; sortOrder: number }>) {
    await this.categories.update({ id }, dto);
    return this.categories.findOne({ where: { id } });
  }

  @Post('catalog')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Add a gift to the catalog — supports rarity, limited supply, seasonal window, animation' })
  async createCatalogItem(@Body() dto: CreateGiftCatalogItemDto) {
    const item = this.catalogItems.create({
      ...dto,
      coinCost: String(dto.coinCost),
      totalSupply: dto.totalSupply !== undefined ? String(dto.totalSupply) : null,
      remainingSupply: dto.totalSupply !== undefined ? String(dto.totalSupply) : null,
      availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
      availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
    });
    return this.catalogItems.save(item);
  }

  @Patch('catalog/:id')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Update, restock, or deactivate a catalog item' })
  async updateCatalogItem(
    @Param('id') id: string,
    @Body() dto: Partial<CreateGiftCatalogItemDto & { active: boolean; addToRemainingSupply: number }>,
  ) {
    if (dto.addToRemainingSupply) {
      // doc: explicit restock action, not a raw field overwrite — avoids an
      // admin accidentally resetting remaining_supply to a stale total.
      await this.catalogItems
        .createQueryBuilder()
        .update(GiftCatalogItem)
        .set({ remainingSupply: () => `COALESCE(remaining_supply, 0) + ${Number(dto.addToRemainingSupply)}` })
        .where('id = :id', { id })
        .execute();
    }
    const { addToRemainingSupply, ...rest } = dto;
    if (Object.keys(rest).length > 0) {
      await this.catalogItems.update({ id }, rest as Partial<GiftCatalogItem>);
    }
    return this.catalogItems.findOne({ where: { id } });
  }

  // ---------- Gift Moderation ----------

  @Get('moderation/hidden')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Currently hidden gift transactions' })
  async listHidden() {
    return this.moderation.listHidden();
  }

  @Post('moderation/:giftTransactionId/hide')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Hide a gift (e.g. abusive attached message) without reversing the coin transaction' })
  async hide(
    @CurrentUser('id') actorId: string,
    @Param('giftTransactionId') giftTransactionId: string,
    @Body('reason') reason: string,
  ) {
    return this.moderation.hide(giftTransactionId, actorId, reason);
  }

  @Post('moderation/:giftTransactionId/unhide')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Reverse a hide decision' })
  async unhide(@CurrentUser('id') actorId: string, @Param('giftTransactionId') giftTransactionId: string) {
    return this.moderation.unhide(giftTransactionId, actorId);
  }

  // ---------- Gift Analytics ----------

  @Get('analytics/top-gifts')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Best-sending gifts by volume/coins spent' })
  async topGifts(@Query('days') days = 30) {
    return this.analytics.topGiftsSent(Number(days));
  }

  @Get('analytics/rarity-distribution')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Send volume by rarity tier' })
  async rarityDistribution(@Query('days') days = 30) {
    return this.analytics.rarityDistribution(Number(days));
  }

  @Get('analytics/seasonal/:seasonTag')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Performance of a specific seasonal event' })
  async seasonalPerformance(@Param('seasonTag') seasonTag: string) {
    return this.analytics.seasonalPerformance(seasonTag);
  }

  @Get('analytics/engagement')
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Unique senders/recipients over the trailing N days' })
  async engagement(@Query('days') days = 30) {
    return this.analytics.uniqueSendersAndRecipients(Number(days));
  }
}
