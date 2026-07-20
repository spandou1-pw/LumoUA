import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppleVerifiedTransaction {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: Date;
  expiresDate: Date | null; // present for subscription products
  isRefunded: boolean;
}

/**
 * doc PAYMENTS.md: Apple is the merchant of record for iOS purchases —
 * Lumo never sees card details, only signed transaction receipts.
 *
 * WHAT'S REAL vs STUBBED (same honesty standard as Stage 4's OAuth stubs):
 * - The orchestration (verify -> parse -> return typed result) is real and
 *   is what PurchaseVerificationService calls.
 * - The actual cryptographic verification is NOT implemented here, because
 *   it requires your real App Store Connect credentials:
 *     1. A signing key (.p8) generated in App Store Connect, used to build
 *        a JWT for calling the App Store Server API
 *        (https://developer.apple.com/documentation/appstoreserverapi).
 *     2. StoreKit 2 sends transactions as signed JWS — verifying them means
 *        validating the JWS against Apple's certificate chain (root CA
 *        pinned) using a library like `@apple/app-store-server-library`
 *        (Apple's official Node SDK) rather than hand-rolling JWT/X.509
 *        verification, which is exactly the kind of custom-crypto Claude's
 *        own security posture (doc 31) says never to do.
 * - App Store Server Notifications V2 (renewal/refund/cancel webhooks) —
 *   same JWS-verification requirement, stubbed at `handleServerNotification`.
 */
@Injectable()
export class AppleIapProvider {
  private readonly logger = new Logger(AppleIapProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verifySignedTransaction(signedTransactionJws: string): Promise<AppleVerifiedTransaction> {
    // TODO(production): use @apple/app-store-server-library:
    //   const client = new AppStoreServerAPIClient(privateKey, keyId, issuerId, bundleId, environment);
    //   const decoded = await client.decodeTransaction(signedTransactionJws); // verifies JWS + cert chain
    // then map `decoded` into AppleVerifiedTransaction below.
    this.assertConfigured();
    this.logger.warn(
      `AppleIapProvider.verifySignedTransaction called with a ${signedTransactionJws.length}-char JWS but is not wired to real App Store credentials`,
    );
    throw new Error('NOT_IMPLEMENTED: verifySignedTransaction requires @apple/app-store-server-library integration');
  }

  /** App Store Server Notifications V2 — renewals, refunds, cancellations pushed by Apple. */
  async handleServerNotification(signedPayload: string): Promise<{
    notificationType: string;
    transaction: AppleVerifiedTransaction | null;
  }> {
    // TODO(production): verify `signedPayload` JWS the same way as above,
    // then branch on notificationType (SUBSCRIBED, DID_RENEW, EXPIRED,
    // REFUND, DID_FAIL_TO_RENEW, etc.) per Apple's documented enum.
    this.assertConfigured();
    this.logger.warn(`AppleIapProvider.handleServerNotification received a ${signedPayload.length}-char payload but cannot verify it yet`);
    throw new Error('NOT_IMPLEMENTED: App Store Server Notifications V2 verification');
  }

  /** Fails fast with a clear message naming the missing credential, rather than a generic error deep in a verification call. */
  private assertConfigured(): void {
    const required = ['APPLE_IAP_PRIVATE_KEY', 'APPLE_IAP_KEY_ID', 'APPLE_IAP_ISSUER_ID', 'APPLE_IAP_BUNDLE_ID'];
    const missing = required.filter((key) => !this.config.get<string>(key));
    if (missing.length > 0) {
      this.logger.error(`Apple IAP not configured — missing: ${missing.join(', ')}`);
    }
  }
}
