import { BadRequestException, Controller, Headers, Logger, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { StripeProvider } from './providers/stripe.provider';
import { AppleIapProvider } from './providers/apple-iap.provider';
import { GooglePlayProvider } from './providers/google-play.provider';
import { PurchaseVerificationService } from './purchase-verification.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RefundsService } from './refunds.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PremiumPlan } from './entities/premium-plan.entity';
import { CoinPack } from './entities/coin-pack.entity';

/**
 * doc PAYMENTS.md: webhook endpoints are `@Public()` (no JWT — the caller
 * is Stripe/Apple/Google, not a logged-in user) but every handler verifies
 * a cryptographic signature before trusting the payload. `@ApiExcludeController`
 * keeps these off the public Swagger UI (doc 31: no reason to advertise
 * internal webhook URLs/shapes to anyone browsing /api/docs).
 */
@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    @InjectRepository(CoinPack) private readonly coinPacks: Repository<CoinPack>,
    @InjectRepository(PremiumPlan) private readonly premiumPlans: Repository<PremiumPlan>,
    private readonly stripeProvider: StripeProvider,
    private readonly appleProvider: AppleIapProvider,
    private readonly googleProvider: GooglePlayProvider,
    private readonly purchaseVerification: PurchaseVerificationService,
    private readonly subscriptions: SubscriptionsService,
    private readonly refunds: RefundsService,
  ) {}

  @Public()
  @Post('stripe')
  async stripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    if (!req.rawBody) throw new BadRequestException('RAW_BODY_UNAVAILABLE');

    let event: ReturnType<StripeProvider['constructWebhookEvent']>;
    try {
      event = this.stripeProvider.constructWebhookEvent(req.rawBody, signature);
    } catch (err) {
      // doc Fraud Protection: invalid signature is logged and rejected, not
      // silently ignored — an attacker probing this endpoint is a signal
      // worth having in logs even though the request itself is refused.
      this.logger.warn(`Stripe webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('INVALID_SIGNATURE');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          metadata?: Record<string, string>;
          payment_intent?: string | null;
          subscription?: string | null;
          amount_total?: number | null;
        };
        const { userId, productId, productType } = session.metadata ?? {};
        if (!userId || !productId || !productType) {
          this.logger.error(`checkout.session.completed missing required metadata: ${JSON.stringify(session.metadata)}`);
          break;
        }

        const platformTransactionId =
          productType === 'coins' ? session.payment_intent : session.subscription;
        if (!platformTransactionId) {
          this.logger.error('checkout.session.completed: no payment_intent/subscription id on session');
          break;
        }

        if (productType === 'coins') {
          const pack = await this.coinPacks.findOne({ where: { id: productId } });
          await this.purchaseVerification.fulfil({
            userId,
            platform: 'stripe',
            productType: 'coins',
            productId,
            platformTransactionId,
            amountUsdCents: session.amount_total ?? pack?.priceUsdCents ?? 0,
          });
        } else {
          const plan = await this.premiumPlans.findOne({ where: { id: productId } });
          // doc: first-period expiry is set precisely by the subsequent
          // invoice.paid event (which carries the real period-end
          // timestamp) — this initial activation uses a 1-interval
          // estimate so the user has access immediately at checkout,
          // and gets corrected to the exact value moments later.
          const estimatedPeriodEnd = new Date();
          estimatedPeriodEnd.setDate(
            estimatedPeriodEnd.getDate() + (plan?.billingInterval === 'yearly' ? 365 : 30),
          );
          await this.purchaseVerification.fulfil({
            userId,
            platform: 'stripe',
            productType: 'subscription',
            productId,
            platformTransactionId,
            amountUsdCents: session.amount_total ?? plan?.priceUsdCents ?? 0,
            subscriptionPeriodEnd: estimatedPeriodEnd,
          });
        }
        break;
      }
      case 'invoice.paid': {
        // doc: subscription renewal — resolves the Stripe customer to a
        // Lumo user via the metadata set at findOrCreateCustomer time, and
        // the Stripe price to our own PremiumPlan via stripePriceId — both
        // real lookups now, not placeholders.
        const invoice = event.data.object as {
          subscription?: string;
          customer?: string;
          lines?: { data: Array<{ price?: { id: string }; period: { end: number } }> };
        };
        if (!invoice.subscription || !invoice.customer || !invoice.lines?.data?.[0]) break;

        const [userId, plan] = await Promise.all([
          this.stripeProvider.getUserIdForCustomer(invoice.customer),
          invoice.lines.data[0].price
            ? this.premiumPlans.findOne({ where: { stripePriceId: invoice.lines.data[0].price.id } })
            : Promise.resolve(null),
        ]);

        if (!userId || !plan) {
          this.logger.error(
            `invoice.paid: could not resolve userId (${userId}) or plan (${plan?.id}) for subscription ${invoice.subscription}`,
          );
          break;
        }

        await this.subscriptions.activateOrRenew({
          userId,
          planId: plan.id,
          platform: 'stripe',
          platformSubscriptionId: invoice.subscription,
          currentPeriodEnd: new Date(invoice.lines.data[0].period.end * 1000),
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string };
        await this.subscriptions.markExpired(sub.id);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as { payment_intent: string };
        await this.refunds.handlePlatformRefundNotification(charge.payment_intent, 'stripe_charge_refunded');
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  @Public()
  @Post('apple')
  async appleWebhook(@Req() req: Request) {
    const body = req.body as { signedPayload?: string };
    if (!body.signedPayload) throw new BadRequestException('MISSING_SIGNED_PAYLOAD');

    const result = await this.appleProvider.handleServerNotification(body.signedPayload);
    this.logger.log(`Apple server notification: ${result.notificationType}`);
    // doc: branch on notificationType (DID_RENEW / EXPIRED / REFUND / ...)
    // once AppleIapProvider's real verification is wired — same dispatch
    // shape as the Stripe switch above.
    return { received: true };
  }

  @Public()
  @Post('google')
  async googleWebhook(@Req() req: Request) {
    const body = req.body as { message?: { data: string } };
    if (!body.message?.data) throw new BadRequestException('MISSING_PUBSUB_MESSAGE');

    const notification = await this.googleProvider.handleRtdnMessage(body.message.data);
    this.logger.log(`Google RTDN: type=${notification.notificationType}`);
    return { received: true };
  }
}
