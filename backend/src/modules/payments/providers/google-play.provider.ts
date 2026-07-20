import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GoogleVerifiedPurchase {
  orderId: string;
  productId: string;
  purchaseToken: string;
  purchaseTimeMillis: number;
  expiryTimeMillis: number | null; // subscriptions only
  isRefunded: boolean;
  acknowledged: boolean;
}

/**
 * doc PAYMENTS.md: Google is the merchant of record for Android purchases.
 *
 * WHAT'S REAL vs STUBBED:
 * - Orchestration (verify token -> typed result -> acknowledge) is real.
 * - Actual verification requires a Google Cloud service account with access
 *   to the Play Developer API (`androidpublisher` v3), authenticated via
 *   `google-auth-library`, calling
 *   `purchases.products.get` / `purchases.subscriptions.get` with the
 *   purchase token the client sends after a Play Billing purchase completes.
 * - Play also requires purchases be *acknowledged* within 3 days
 *   (`purchases.products.acknowledge` / `.subscriptions.acknowledge`) or
 *   Google auto-refunds them — `acknowledgePurchase` below is the real
 *   contract PurchaseVerificationService calls after crediting the wallet,
 *   stubbed the same way pending real service-account credentials.
 * - Real-time Developer Notifications (RTDN) arrive via a Google Cloud
 *   Pub/Sub subscription, not a plain HTTP webhook — `handleRtdnMessage`
 *   is the shape a Pub/Sub push endpoint would receive.
 */
@Injectable()
export class GooglePlayProvider {
  private readonly logger = new Logger(GooglePlayProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verifyPurchaseToken(productId: string, purchaseToken: string): Promise<GoogleVerifiedPurchase> {
    // TODO(production): googleapis' `androidpublisher_v3` client:
    //   const auth = new google.auth.GoogleAuth({ keyFile, scopes: [...] });
    //   const publisher = google.androidpublisher({ version: 'v3', auth });
    //   const res = await publisher.purchases.products.get({ packageName, productId, token: purchaseToken });
    this.assertConfigured();
    this.logger.warn(
      `GooglePlayProvider.verifyPurchaseToken called for product ${productId} (token length ${purchaseToken.length}) but is not wired to real Play Developer API credentials`,
    );
    throw new Error(
      'NOT_IMPLEMENTED: requires GOOGLE_PLAY_SERVICE_ACCOUNT_JSON and the googleapis androidpublisher client',
    );
  }

  async acknowledgePurchase(productId: string, purchaseToken: string): Promise<void> {
    this.assertConfigured();
    this.logger.warn(`GooglePlayProvider.acknowledgePurchase called for product ${productId}, token length ${purchaseToken.length}`);
    throw new Error('NOT_IMPLEMENTED: Play Developer API purchases.products.acknowledge');
  }

  async handleRtdnMessage(pubsubMessageData: string): Promise<{ notificationType: number; purchaseToken: string }> {
    // TODO(production): base64-decode pubsubMessageData -> DeveloperNotification JSON
    // per https://developer.android.com/google/play/billing/rtdn-reference
    this.logger.warn(`GooglePlayProvider.handleRtdnMessage received a ${pubsubMessageData.length}-char payload`);
    throw new Error('NOT_IMPLEMENTED: RTDN payload parsing');
  }

  private assertConfigured(): void {
    const missing = ['GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', 'GOOGLE_PLAY_PACKAGE_NAME'].filter(
      (key) => !this.config.get<string>(key),
    );
    if (missing.length > 0) {
      this.logger.error(`Google Play Billing not configured — missing: ${missing.join(', ')}`);
    }
  }
}
