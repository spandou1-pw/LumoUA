import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitGeneral } from '../../common/decorators/rate-limit.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { GiftsService } from './gifts.service';
import { GiftCatalogService } from './gift-catalog.service';
import { GiftInventoryService } from './gift-inventory.service';
import { GiftShowcaseService } from './gift-showcase.service';
import { SendGiftDto } from './dto/gift.dto';
import { GiftRarity } from './entities/gift-catalog-item.entity';

@ApiTags('Gifts')
@ApiBearerAuth()
@Controller('gifts')
export class GiftsController {
  constructor(
    private readonly giftsService: GiftsService,
    private readonly catalogService: GiftCatalogService,
    private readonly inventoryService: GiftInventoryService,
    private readonly showcaseService: GiftShowcaseService,
  ) {}

  // ---------- Gift Store / Categories / Search ----------

  @Get('categories')
  @ApiOperation({ summary: 'Gift Categories' })
  async categories() {
    return this.catalogService.listCategories();
  }

  @Get('store')
  @ApiOperation({ summary: 'Gift Store — browse, with optional category/rarity/season/animated/search filters' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'rarity', required: false, enum: ['common', 'rare', 'legendary'] })
  @ApiQuery({ name: 'seasonTag', required: false })
  @ApiQuery({ name: 'animatedOnly', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Gift Search — free-text match on name' })
  async store(
    @Query('categoryId') categoryId?: string,
    @Query('rarity') rarity?: GiftRarity,
    @Query('seasonTag') seasonTag?: string,
    @Query('animatedOnly') animatedOnly?: string,
    @Query('q') q?: string,
  ) {
    return this.catalogService.browse({
      categoryId,
      rarity,
      seasonTag,
      animatedOnly: animatedOnly === 'true',
      q,
    });
  }

  @Get('store/rare')
  @ApiOperation({ summary: 'Rare Gifts shortcut' })
  async rare() {
    return this.catalogService.listByRarity('rare');
  }

  @Get('store/legendary')
  @ApiOperation({ summary: 'Legendary Gifts shortcut' })
  async legendary() {
    return this.catalogService.listByRarity('legendary');
  }

  @Get('store/seasonal')
  @ApiOperation({ summary: 'Seasonal Gifts, grouped by season tag' })
  async seasonal() {
    return this.catalogService.listActiveSeasonal();
  }

  // ---------- Sending / Receiving ----------

  @Post('send')
  @RateLimitGeneral()
  @ApiOperation({ summary: 'Send a gift — debits sender coins (non-redeemable by recipient, see PAYMENTS.md)' })
  async send(@CurrentUser('id') senderId: string, @Body() dto: SendGiftDto) {
    return this.giftsService.send(senderId, dto);
  }

  @Get('history/received')
  @ApiOperation({ summary: 'Gift History — received, cursor-paginated' })
  async receivedHistory(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.giftsService.receivedHistory(userId, pagination.cursor, pagination.limit);
  }

  @Get('history/sent')
  @ApiOperation({ summary: 'Gift History — sent, cursor-paginated' })
  async sentHistory(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.giftsService.sentHistory(userId, pagination.cursor, pagination.limit);
  }

  // ---------- Inventory / Collection ----------

  @Get('inventory/me')
  @ApiOperation({ summary: 'Gift Inventory — everything the current user owns' })
  async myInventory(@CurrentUser('id') userId: string) {
    return this.inventoryService.listForUser(userId);
  }

  @Get('inventory/:userId')
  @ApiOperation({ summary: "Another user's public gift inventory" })
  async userInventory(@Param('userId') userId: string) {
    return this.inventoryService.listForUser(userId);
  }

  @Get('collection/me')
  @ApiOperation({ summary: 'Gift Collection summary — distinct items owned, total received' })
  async myCollection(@CurrentUser('id') userId: string) {
    return this.inventoryService.collectionSummary(userId);
  }

  // ---------- Showcase ----------

  @Get('showcase/:userId')
  @ApiOperation({ summary: 'Gift Showcase — featured gifts on a profile' })
  async showcase(@Param('userId') userId: string) {
    return this.showcaseService.getShowcase(userId);
  }

  @Post('showcase/:position')
  @ApiOperation({ summary: 'Feature an owned gift in a showcase slot (slot count limited by premium tier)' })
  async setShowcaseSlot(
    @CurrentUser('id') userId: string,
    @Param('position') position: string,
    @Body('giftCatalogItemId') giftCatalogItemId: string,
  ) {
    return this.showcaseService.setSlot(userId, Number(position), giftCatalogItemId);
  }

  @Delete('showcase/:position')
  @ApiOperation({ summary: 'Clear a showcase slot' })
  async clearShowcaseSlot(@CurrentUser('id') userId: string, @Param('position') position: string) {
    await this.showcaseService.clearSlot(userId, Number(position));
    return { cleared: true };
  }
}
