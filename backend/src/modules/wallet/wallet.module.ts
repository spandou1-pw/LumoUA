import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { CoinTransfer } from './entities/coin-transfer.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';
import { WalletService } from './wallet.service';
import { WalletSecurityService } from './wallet-security.service';
import { WalletFraudService } from './wallet-fraud.service';
import { WalletAnalyticsService } from './wallet-analytics.service';
import { CoinTransferService } from './coin-transfer.service';
import { WalletController } from './wallet.controller';
import { WalletAdminController } from './wallet-admin.controller';
import { UsersModule } from '../users/users.module';
import { PremiumModule } from '../premium/premium.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction, CoinTransfer, AdminAuditLog]),
    UsersModule, // PolicyService — blocked-relationship check on transfers (doc 24)
    PremiumModule, // PremiumLimitsService — daily transfer cap by tier
    NotificationsModule,
  ],
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService, WalletSecurityService, WalletFraudService, WalletAnalyticsService, CoinTransferService],
  exports: [WalletService, WalletSecurityService, CoinTransferService, WalletAnalyticsService],
})
export class WalletModule {}
