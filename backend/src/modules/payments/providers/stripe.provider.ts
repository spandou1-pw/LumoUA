import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * doc PAYMENTS.md: Stripe is the merchant of record for web/desktop
 * purchases — Lumo never handles raw card numbers (Stripe.js/Elements
 * tokenizes client-side; the server only ever sees a token/session id).
 * Apple Pay / Google Pay are payment *methods* inside Stripe Checkout /
 * PaymentSheet, not separate integrations — enabling them is a Stripe
 * Dashboard configuration + `payment_method_types` list, not additional
 * backend code.
 */
@Injectable()
export class StripeProvider {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeProvider.name);
  readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    this.stripe = new Stripe(apiKey, { apiVersion: '2024-06-20' });
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
  }

  /** doc: one-time coin-pack purchase — Stripe Checkout, not a raw PaymentIntent, so
   * Apple Pay/Google Pay/card/etc. are all handled by Stripe's hosted UI. */
  async createCoinPackCheckoutSession(params: {
    userId: string;
    stripePriceId: string;
    purchaseId: string;
    productId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: params.stripePriceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      // doc: replay/idempotency — our own purchaseId travels through Stripe
      // and comes back on the webhook so we can match it without trusting
      // client-supplied state. productId/productType ride along too so the
      // webhook can call PurchaseVerificationService.fulfil() self-contained,
      // without a separate pending-checkout lookup table.
      metadata: { purchaseId: params.purchaseId, userId: params.userId, productId: params.productId, productType: 'coins' },
    });
  }

  async createSubscriptionCheckoutSession(params: {
    userId: string;
    stripePriceId: string;
    purchaseId: string;
    productId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: params.stripePriceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      metadata: { purchaseId: params.purchaseId, userId: params.userId, productId: params.productId, productType: 'subscription' },
    });
  }

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  }

  /** doc Fraud Protection: signature verification is mandatory — never trust an unverified webhook body. */
  constructWebhookEvent(rawBody: Buffer, signatureHeader: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signatureHeader, this.webhookSecret);
  }

  async refundPaymentIntent(paymentIntentId: string, reason?: string): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason as Stripe.RefundCreateParams.Reason | undefined,
    });
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(stripeSubscriptionId);
  }

  async getInvoicesForCustomer(customerId: string, limit = 20): Promise<Stripe.Invoice[]> {
    const result = await this.stripe.invoices.list({ customer: customerId, limit });
    return result.data;
  }

  async findOrCreateCustomer(userId: string, email: string): Promise<Stripe.Customer> {
    const existing = await this.stripe.customers.search({ query: `metadata['userId']:'${userId}'` });
    if (existing.data[0]) return existing.data[0];
    const created = await this.stripe.customers.create({ email, metadata: { userId } });
    this.logger.log(`Created Stripe customer ${created.id} for user ${userId}`);
    return created;
  }

  /** doc: resolves customer.metadata.userId — set at findOrCreateCustomer time — so webhook
   * handlers keyed only by Stripe customer/subscription id can find the Lumo user. */
  async getUserIdForCustomer(customerId: string): Promise<string | null> {
    const customer = await this.stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer.metadata?.userId as string | undefined) ?? null;
  }
}
