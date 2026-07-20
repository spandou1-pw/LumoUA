# PAYMENTS.md — Monetization Platform (Stage 6)

## The one architectural decision everything else follows

**Єдина's coin balance is non-redeemable.** Real money flows in through Apple/Google/Stripe (they are the merchant of record — Єдина never touches raw card data). Coins flow out only by being spent inside the app (gifts, premium perks). **There is no code path anywhere in this codebase that converts coins back into real money for a user**, and no code path that pays out real money to a gift recipient. This is what keeps Єдина out of money-transmission/e-money licensing territory (see Stage 5's flagged concern) while still shipping a real coins/gifts economy — the same pattern Discord Nitro, TikTok Coins, and similar products use.

If the product later wants **creator payouts** (cashing out received gifts to a bank account), that is a *different, larger* feature requiring Stripe Connect (KYC, tax forms, payout scheduling) and a fresh legal review — not an extension of the Wallet module. It is explicitly not built here. `GiftsService` documents this boundary at the code level, not just here.

## What's real vs. stubbed (same standard as Stage 4/5)

| Component | Status |
|---|---|
| Wallet ledger (credit/debit, optimistic locking, non-negative balance) | ✅ **Fully real** — this is pure application logic, no external dependency |
| Stripe: Checkout sessions, webhook handling, refunds, invoices, billing portal, customer management | ✅ **Fully real** — calls the actual `stripe` SDK. Needs a real `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` to run against Stripe's API (test mode keys work fine for development) |
| Apple Pay / Google Pay | ✅ **Not separate code** — these are payment methods inside Stripe Checkout/PaymentSheet, enabled via Stripe Dashboard config, not additional backend integration |
| Apple In-App Purchase verification | ⚠️ **Stubbed** — orchestration is real, cryptographic JWS verification requires your App Store Connect private key + `@apple/app-store-server-library`. See `providers/apple-iap.provider.ts` |
| Google Play Billing verification | ⚠️ **Stubbed** — orchestration is real, needs a Google Cloud service account + `googleapis` androidpublisher client. See `providers/google-play.provider.ts` |
| Purchase Verification (cross-platform fulfillment, idempotency) | ✅ **Fully real** — the DB-level unique constraint on `platform_transaction_id` is what actually prevents double-fulfillment, tested in `test/unit/wallet.service.spec.ts`'s sibling coverage |
| Subscriptions (activation/renewal/expiry state machine) | ✅ **Fully real** for the state machine itself; Stripe's `invoice.paid`/`customer.subscription.deleted` webhooks drive it end-to-end. Apple/Google renewal webhooks are stubbed pending their provider verification |
| Refunds | ✅ **Real** for admin-initiated Stripe refunds (calls Stripe's actual refund API) and for reversing wallet/subscription entitlements. Apple/Google refunds are user-initiated on their side — Єдина only *reacts* to their notification once that provider integration is wired |
| Invoices | ✅ **Real** — Stripe is the invoice system of record; `GET /payments/stripe/invoices` reads directly from Stripe |
| Fraud Protection | ✅ **Real**, layered: DB-unique replay protection (strongest), Redis velocity limiting, Stripe Radar (automatic on every Checkout session), failed-verification tracking for admin triage |
| Payment Analytics | ✅ **Real** — revenue-by-day, top coin packs, active subscriptions by platform, refund rate, all real SQL aggregates against `purchases`/`subscriptions` |
| Admin Dashboard | ✅ **API layer real** (`/admin/payments/*`) — a visual dashboard UI is a separate frontend task (see Stage 2's design system if/when that's prioritized) |
| Coins purchase / Gift purchase | ✅ **Fully real** end-to-end for the Stripe path; Apple/Google paths are real once their provider stubs are filled in |

## Getting real Apple/Google credentials wired (next step, not done here)

**Apple:**
1. App Store Connect → Users and Access → Integrations → generate an App Store Server API key (`.p8` file).
2. `npm install @apple/app-store-server-library`.
3. Fill in `AppleIapProvider.verifySignedTransaction`/`handleServerNotification` per the TODO comments — Apple's official SDK does the JWS/certificate-chain verification; do not hand-roll it (doc 31's no-custom-crypto rule).
4. Register the webhook URL (`/webhooks/apple`) in App Store Connect for Server Notifications V2.

**Google:**
1. Google Cloud Console → create a service account with the Play Developer API enabled, linked in Play Console.
2. `npm install googleapis`.
3. Fill in `GooglePlayProvider.verifyPurchaseToken`/`acknowledgePurchase`/`handleRtdnMessage` per the TODOs.
4. Set up a Pub/Sub topic + push subscription pointing at `/webhooks/google` for Real-time Developer Notifications.

**Stripe** (already fully wired, just needs real keys):
1. `STRIPE_SECRET_KEY` from the Stripe Dashboard (test mode is fine for development).
2. `STRIPE_WEBHOOK_SECRET` — create a webhook endpoint pointed at `/webhooks/stripe` (use `stripe listen --forward-to localhost:3000/webhooks/stripe` for local dev), subscribed to at minimum: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`, `charge.refunded`.
3. Enable Apple Pay / Google Pay in the Stripe Dashboard's payment methods settings — no code change needed.

## Financial correctness design

- **Append-only ledger** (`wallet_transactions`) is the source of truth; `wallets.coin_balance` is a materialized cache updated only inside the same DB transaction as a ledger insert (`WalletService.applyLedgerMutation`). They cannot drift because they're never written independently.
- **Optimistic locking** (`@VersionColumn` on `Wallet`) + a retry loop handles concurrent spend races (e.g., a user double-tapping "send gift") without a heavier pessimistic lock on every wallet read.
- **No negative balances, ever** — enforced both at the application layer (`WalletService` rejects a debit that would go negative) and at the database layer (`CHECK (coin_balance >= 0)` constraint) — defense in depth, not just one or the other.
- **Idempotent purchase fulfillment** — `purchases.platform_transaction_id` has a hard UNIQUE constraint. A webhook redelivery or a client retrying a verification call cannot double-credit a wallet; the duplicate insert fails and `PurchaseVerificationService` returns the existing record instead.
- **bigint, never float** — every coin/money amount is `bigint` end-to-end (surfaced as strings in JSON, per JS's lack of native 64-bit ints), never a JS `number`/float, which would risk silent precision loss on large balances.

## Testing

- `test/unit/wallet.service.spec.ts` — 9 tests covering the ledger's core financial invariants (exact credit/debit amounts, negative-balance rejection, balance independence across users, notional-only entries never affecting spendable balance). This is the highest-value test file in the whole payments module — read it first if reviewing this stage.
- `test/integration/wallet-gifts.integration-spec.ts` — real HTTP + real Postgres, exercises wallet balance, gift sending, insufficient-balance rejection returning the correct HTTP status, and the non-redemption boundary (recipient's spendable balance never increases from a received gift).
- **Not yet covered**: Stripe webhook signature verification tests (needs a real or mocked Stripe event payload + signature, a reasonable next addition), Apple/Google provider tests (blocked on real credentials per the stub status above).

## What Stage 6 did NOT build (explicitly, not by oversight)

- Creator payout / cash-out of received gifts (Stripe Connect — a distinct feature + legal review).
- Currency conversion / multi-currency pricing beyond USD reference prices (regional pricing is handled by Apple/Google's own store configuration; Stripe would need `currency_options` on prices for true multi-currency Checkout).
- A visual admin dashboard UI — `/admin/payments/*` is a real, complete API; wiring it to a frontend is separate work.
- Tax calculation/remittance — Apple/Google handle this themselves as merchant of record; Stripe Tax would be a separate integration if Stripe volume grows enough to need it, not assumed necessary from day one.
