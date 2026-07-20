import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimitAuth } from '../../common/decorators/rate-limit.decorator';
import { v4 as uuid } from 'uuid';
import { PurchaseVerificationService } from './purchase-verification.service';
import { StripeProvider } from './providers/stripe.provider';
import { AppleIapProvider } from './providers/apple-iap.provider';
import { GooglePlayProvider } from './providers/google-play.provider';
import { FraudService } from './fraud.service';
import { CreateCheckoutSessionDto, VerifyApplePurchaseDto, VerifyGooglePurchaseDto } from './dto/purchase.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinPack } from './entities/coin-pack.entity';
import { PremiumPlan } from './entities/premium-plan.entity';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    @InjectRepository(CoinPack) private readonly coinPacks: Repository<CoinPack>,
    @InjectRepository(PremiumPlan) private readonly premiumPlans: Repository<PremiumPlan>,
    private readonly purchaseVerification: PurchaseVerificationService,
    private readonly stripeProvider: StripeProvider,
    private readonly appleProvider: AppleIapProvider,
    private readonly googleProvider: GooglePlayProvider,
    private readonly fraud: FraudService,
    private readonly config: ConfigService,
  ) {}

  @Get('catalog/coins')
  @ApiOperation({ summary: 'Available coin packs' })
  async coinCatalog() {
    return this.coinPacks.find({ where: { active: true } });
  }

  @Get('catalog/premium')
  @ApiOperation({ summary: 'Available premium plans' })
  async premiumCatalog() {
    return this.premiumPlans.find({ where: { active: true } });
  }

  // ---------- Stripe (web/desktop) ----------

  @Post('stripe/checkout-session')
  @RateLimitAuth()
  @ApiOperation({ summary: 'Create a Stripe Checkout session for a coin pack or premium plan (Apple Pay/Google Pay available as payment methods within it)' })
  async createStripeCheckout(@CurrentUser('id') userId: string, @Body() dto: CreateCheckoutSessionDto) {
    const stripePriceId = await this.resolveStripePriceId(dto.productId, dto.productType);
    const purchaseId = uuid(); // pre-generated so it can travel through Stripe metadata and match on webhook
    const baseUrl = this.config.get<string>('APP_PUBLIC_URL') ?? 'https://edina.ua';

    const session =
      dto.productType === 'coins'
        ? await this.stripeProvider.createCoinPackCheckoutSession({
            userId,
            stripePriceId,
            purchaseId,
            productId: dto.productId,
            successUrl: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/payments/cancel`,
          })
        : await this.stripeProvider.createSubscriptionCheckoutSession({
            userId,
            stripePriceId,
            purchaseId,
            productId: dto.productId,
            successUrl: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/payments/cancel`,
          });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  @Get('stripe/invoices')
  @ApiOperation({ summary: 'List Stripe invoices for the current user (Stripe is the invoice system of record)' })
  async invoices(@CurrentUser('id') userId: string, @CurrentUser('username') username: string) {
    // doc: in production, the Stripe customer id is stored on the user
    // record at first checkout rather than searched-for on every call —
    // simplified here since that denormalization is a one-line addition,
    // not core to the invoicing flow itself.
    const customer = await this.stripeProvider.findOrCreateCustomer(userId, `${username}@edina.ua`);
    return this.stripeProvider.getInvoicesForCustomer(customer.id);
  }

  @Post('stripe/billing-portal')
  @ApiOperation({ summary: 'Stripe-hosted billing portal — manage/cancel subscription, view invoices/receipts' })
  async billingPortal(@CurrentUser('id') userId: string, @CurrentUser('username') username: string) {
    const customer = await this.stripeProvider.findOrCreateCustomer(userId, `${username}@edina.ua`);
    const baseUrl = this.config.get<string>('APP_PUBLIC_URL') ?? 'https://edina.ua';
    const session = await this.stripeProvider.createBillingPortalSession(customer.id, `${baseUrl}/settings/premium`);
    return { url: session.url };
  }

  // ---------- Apple / Google (mobile) ----------

  @Post('apple/verify')
  @RateLimitAuth()
  @ApiOperation({ summary: 'Verify a StoreKit 2 signed transaction and fulfil the purchase' })
  async verifyApple(@CurrentUser('id') userId: string, @Body() dto: VerifyApplePurchaseDto) {
    try {
      const tx = await this.appleProvider.verifySignedTransaction(dto.signedTransaction);
      const amountUsdCents = await this.resolveCatalogPriceUsdCents(dto.productId, dto.productType);
      return this.purchaseVerification.fulfil({
        userId,
        platform: 'apple',
        productType: dto.productType,
        productId: dto.productId,
        platformTransactionId: tx.transactionId,
        amountUsdCents,
        rawReceipt: dto.signedTransaction,
        subscriptionPeriodEnd: tx.expiresDate ?? undefined,
      });
    } catch (err) {
      await this.fraud.recordFailedVerification(userId);
      throw err;
    }
  }

  @Post('google/verify')
  @RateLimitAuth()
  @ApiOperation({ summary: 'Verify a Google Play purchase token and fulfil the purchase' })
  async verifyGoogle(@CurrentUser('id') userId: string, @Body() dto: VerifyGooglePurchaseDto) {
    try {
      const purchase = await this.googleProvider.verifyPurchaseToken(dto.googleProductId, dto.purchaseToken);
      const amountUsdCents = await this.resolveCatalogPriceUsdCents(dto.productId, dto.productType);
      const fulfilled = await this.purchaseVerification.fulfil({
        userId,
        platform: 'google',
        productType: dto.productType,
        productId: dto.productId,
        platformTransactionId: purchase.orderId,
        amountUsdCents,
        rawReceipt: dto.purchaseToken,
        subscriptionPeriodEnd: purchase.expiryTimeMillis ? new Date(purchase.expiryTimeMillis) : undefined,
      });
      await this.googleProvider.acknowledgePurchase(dto.googleProductId, dto.purchaseToken); // doc: required within 3 days or Google auto-refunds
      return fulfilled;
    } catch (err) {
      await this.fraud.recordFailedVerification(userId);
      throw err;
    }
  }

  /** doc: the reference USD price stored in our own catalog — actual regional/tax-adjusted
   * charged price lives with Apple/Google; this is used for internal analytics consistency,
   * not disputed against the store's own financial reporting. */
  private async resolveCatalogPriceUsdCents(productId: string, productType: 'coins' | 'subscription'): Promise<number> {
    if (productType === 'coins') {
      const pack = await this.coinPacks.findOne({ where: { id: productId } });
      if (!pack) throw new NotFoundException('COIN_PACK_NOT_FOUND');
      return pack.priceUsdCents;
    }
    const plan = await this.premiumPlans.findOne({ where: { id: productId } });
    if (!plan) throw new NotFoundException('PREMIUM_PLAN_NOT_FOUND');
    return plan.priceUsdCents;
  }

  private async resolveStripePriceId(productId: string, productType: 'coins' | 'subscription'): Promise<string> {
    if (productType === 'coins') {
      const pack = await this.coinPacks.findOne({ where: { id: productId } });
      if (!pack?.stripePriceId) throw new NotFoundException('COIN_PACK_NOT_AVAILABLE_ON_STRIPE');
      return pack.stripePriceId;
    }
    const plan = await this.premiumPlans.findOne({ where: { id: productId } });
    if (!plan?.stripePriceId) throw new NotFoundException('PLAN_NOT_AVAILABLE_ON_STRIPE');
    return plan.stripePriceId;
  }
}
