import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Purchase } from './entities/purchase.entity';
import { CoinPack } from './entities/coin-pack.entity';
import { RefundRecord, RefundInitiator } from './entities/refund-record.entity';
import { WalletService } from '../wallet/wallet.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { StripeProvider } from './providers/stripe.provider';

/**
 * doc PAYMENTS.md: refunds can be *initiated* from three places —
 *  - the user, via Apple/Google's own refund request flow (Lumo has no
 *    say in whether Apple/Google grant it — we only find out via webhook)
 *  - an admin, for a Stripe purchase (we can call Stripe's refund API directly)
 *  - a platform webhook telling us a refund already happened (Apple/Google)
 * All three converge on `reverseFulfillment` below — the entitlement
 * reversal logic is identical regardless of who/what triggered it.
 */
@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(Purchase) private readonly purchases: Repository<Purchase>,
    @InjectRepository(CoinPack) private readonly coinPacks: Repository<CoinPack>,
    @InjectRepository(RefundRecord) private readonly refundRecords: Repository<RefundRecord>,
    private readonly wallet: WalletService,
    private readonly subscriptions: SubscriptionsService,
    private readonly stripeProvider: StripeProvider,
    private readonly events: EventEmitter2,
  ) {}

  /** Admin-initiated refund for a Stripe purchase — the only platform where Lumo can trigger the refund itself. */
  async adminRefundStripePurchase(purchaseId: string, adminActorId: string, reason: string): Promise<RefundRecord> {
    const purchase = await this.purchases.findOne({ where: { id: purchaseId } });
    if (!purchase) throw new NotFoundException('PURCHASE_NOT_FOUND');
    if (purchase.platform !== 'stripe') {
      throw new ConflictException('ONLY_STRIPE_PURCHASES_CAN_BE_ADMIN_REFUNDED');
    }
    if (purchase.status === 'refunded') {
      throw new ConflictException('PURCHASE_ALREADY_REFUNDED');
    }

    await this.stripeProvider.refundPaymentIntent(purchase.platformTransactionId, reason);
    return this.reverseFulfillment(purchase, 'admin', reason, adminActorId);
  }

  /** Called from Apple/Google/Stripe webhook handlers once a refund is confirmed on their side. */
  async handlePlatformRefundNotification(platformTransactionId: string, reason: string): Promise<RefundRecord | null> {
    const purchase = await this.purchases.findOne({ where: { platformTransactionId } });
    if (!purchase || purchase.status === 'refunded') return null;
    return this.reverseFulfillment(purchase, 'platform_webhook', reason);
  }

  private async reverseFulfillment(
    purchase: Purchase,
    initiatedBy: RefundInitiator,
    reason: string,
    adminActorId?: string,
  ): Promise<RefundRecord> {
    if (purchase.productType === 'coins') {
      const pack = await this.coinPacks.findOne({ where: { id: purchase.productId } });
      if (pack) {
        // doc: coins already spent by the time of refund are NOT clawed back
        // beyond the current balance — WalletService rejects a debit that
        // would go negative, so this can throw INSUFFICIENT_COIN_BALANCE.
        // That's a deliberate product decision surfaced here, not silently
        // swallowed: refunding coins a user already spent needs a support
        // decision (write off vs. negative-balance-with-recovery-plan),
        // not an automatic silent failure.
        await this.wallet.debit({
          userId: purchase.userId,
          amount: BigInt(pack.coinAmount),
          type: 'refund_reversal',
          referenceType: 'purchase',
          referenceId: purchase.id,
          metadata: { reason },
        });
      }
    } else {
      await this.subscriptions.markExpired(purchase.platformTransactionId);
    }

    purchase.status = 'refunded';
    await this.purchases.save(purchase);

    const record = await this.refundRecords.save(
      this.refundRecords.create({
        purchaseId: purchase.id,
        refundedAmountUsdCents: purchase.amountUsdCents,
        reason,
        initiatedBy,
        adminActorId: adminActorId ?? null,
      }),
    );

    this.events.emit('purchase.refunded', { purchase, refund: record });
    return record;
  }
}
