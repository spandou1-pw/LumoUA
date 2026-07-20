import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinPack } from './entities/coin-pack.entity';
import { PremiumPlan } from './entities/premium-plan.entity';
import { Purchase } from './entities/purchase.entity';
import { User } from '../users/entities/user.entity';
import { RefundRecord } from './entities/refund-record.entity';
import { StripeProvider } from './providers/stripe.provider';
import { AppleIapProvider } from './providers/apple-iap.provider';
import { GooglePlayProvider } from './providers/google-play.provider';
import { PurchaseVerificationService } from './purchase-verification.service';
import { RefundsService } from './refunds.service';
import { FraudService } from './fraud.service';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { WalletModule } from '../wallet/wallet.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AdminPaymentsController } from '../admin-payments/admin-payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoinPack, PremiumPlan, Purchase, RefundRecord, User]),
    WalletModule,
    SubscriptionsModule,
  ],
  controllers: [PaymentsController, WebhooksController, AdminPaymentsController],
  providers: [
    StripeProvider,
    AppleIapProvider,
    GooglePlayProvider,
    PurchaseVerificationService,
    RefundsService,
    FraudService,
    PaymentAnalyticsService,
  ],
  exports: [PurchaseVerificationService, RefundsService, PaymentAnalyticsService],
})
export class PaymentsModule {}
