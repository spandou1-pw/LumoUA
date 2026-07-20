import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCatalogItem } from './entities/gift-catalog-item.entity';
import { GiftCategory } from './entities/gift-category.entity';
import { GiftTransaction } from './entities/gift-transaction.entity';
import { UserGiftInventory } from './entities/user-gift-inventory.entity';
import { GiftShowcaseSlot } from './entities/gift-showcase-slot.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';
import { GiftsService } from './gifts.service';
import { GiftCatalogService } from './gift-catalog.service';
import { GiftInventoryService } from './gift-inventory.service';
import { GiftShowcaseService } from './gift-showcase.service';
import { GiftModerationService } from './gift-moderation.service';
import { GiftAnalyticsService } from './gift-analytics.service';
import { GiftsController } from './gifts.controller';
import { GiftAdminController } from './gift-admin.controller';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PremiumModule } from '../premium/premium.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GiftCatalogItem,
      GiftCategory,
      GiftTransaction,
      UserGiftInventory,
      GiftShowcaseSlot,
      AdminAuditLog,
    ]),
    WalletModule,
    UsersModule,
    NotificationsModule,
    PremiumModule, // PremiumLimitsService — showcase slot count (doc PREMIUM.md)
  ],
  controllers: [GiftsController, GiftAdminController],
  providers: [
    GiftsService,
    GiftCatalogService,
    GiftInventoryService,
    GiftShowcaseService,
    GiftModerationService,
    GiftAnalyticsService,
  ],
  exports: [GiftsService, GiftCatalogService, GiftInventoryService, GiftShowcaseService, GiftAnalyticsService],
})
export class GiftsModule {}
