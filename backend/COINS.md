# COINS.md — Coins Economy (Stage 9)

## The one new risk this stage introduces, and how it's contained

Stage 6 established coins as non-redeemable and Stage 8's Gifts kept transfers one-directional (sender debited, recipient gets a display-only record). **Coins Transfers** breaks that pattern deliberately: the recipient of a transfer receives real, spendable coins. That's a materially larger risk surface than anything built so far, so it gets real controls, not just documentation:

- **Still fully closed-loop**: coins entering the system only come from Apple/Google/Stripe purchases (Stage 6); they can still never leave the system as cash. This is what keeps peer-to-peer transfer of a closed-loop currency in a meaningfully different (generally lower) regulatory category than transferring actual money — the same reasoning that lets Robux, V-Bucks, and similar in-app currencies support P2P transfer without their operators being money transmitters. This is a general pattern, not a specific legal conclusion for any one jurisdiction — real legal review (doc 49) should confirm this holds for wherever Єдина actually launches.
- **Daily transfer caps**, tiered by premium status (`PremiumLimitsService.dailyCoinTransferLimit`) — free 5,000/day, premium 50,000/day — enforced server-side via a rolling Redis counter, checked before every transfer.
- **Velocity limiting** (max 15 transfers/hour) — same layered-defense philosophy as Stage 6's `FraudService`.
- **Structuring-pattern detection** — 8+ distinct recipients in 24h auto-flags a transfer for admin review (doesn't block it — false positives blocking real users is a worse failure mode than a delayed review, consistent with every other fraud check in this codebase).
- **Wallet Security (lock/freeze)** — new to this stage: an admin (or, wired in the future, an automated trigger off the fraud signals above) can freeze a wallet, blocking further outbound spend/transfer while an investigation happens, without freezing incoming credits (a refund reversal or admin correction can still land on a locked wallet).
- **Atomicity**: unlike a gift send (one debit call), a transfer is debit-and-credit in a single database transaction (`WalletService.transferBetweenWallets`) — a process crash between the two halves cannot leave a sender debited with no matching recipient credit. This is the single most important correctness property in this stage and has dedicated test coverage.

## Feature → implementation map

| Requested feature | Implementation |
|---|---|
| Coins Wallet | `Wallet` entity (Stage 6), extended with `locked`/`lockedReason`/`lockedAt` this stage |
| Coins Purchase | Already fully built in Stage 6 (`PurchaseVerificationService`, Apple/Google/Stripe) — not rebuilt here |
| Coins Spending | Already built (gifts, Stage 8) — `WalletService.debit()` is the one spend path every feature routes through |
| Coins Transfers | `CoinTransferService.transfer()` — new this stage, the focus of the risk discussion above |
| Coins Balance | `GET /wallet/balance` — now also reports `locked` status |
| Coins History | `GET /wallet/transactions` (ledger) + `GET /wallet/transfers/sent`\|`/received` (transfer-specific view), both cursor-paginated |
| Wallet Security | `WalletSecurityService` — lock/unlock, checked by every debit/transfer path before it proceeds |
| Wallet API | `WalletController` |
| Wallet Analytics | `WalletAnalyticsService` — transfer volume by day, top senders, flagged-transfer count, ledger breakdown by type. Purchase revenue analytics already exists (Stage 6 `PaymentAnalyticsService`) and isn't duplicated |
| Fraud Detection | `WalletFraudService` — velocity limiting + structuring-pattern flagging, distinct from Stage 6's `FraudService` (which covers *purchase* fraud, not *transfer* fraud — different attack shapes) |
| Admin Panel | `WalletAdminController` — lock/unlock, manual balance adjustments (always actor + reason, audit-logged per doc 24), flagged-transfer review queue, analytics |
| Testing | `test/unit/wallet-transfer.spec.ts`, `test/unit/coin-transfer.service.spec.ts` |
| Documentation | This file |

## Why WalletService.transfer isn't just two applyLedgerMutation calls

`applyLedgerMutation` (Stage 6) opens its own database transaction per call — calling it twice (once to debit the sender, once to credit the recipient) would mean two independent commits. If the process crashed, lost its database connection, or threw between the two calls, the sender's coins would already be gone with no corresponding credit anywhere — coins vanish, silently, with no error visible to anyone. `transferBetweenWallets` instead opens exactly one transaction, mutates both wallets' cached balances, and writes both ledger rows before committing — either the whole transfer lands or none of it does. This is worth stating explicitly because it would have been easy (and looked correct in a quick read) to implement transfers as "just call debit, then call credit" — that version passes a happy-path test and fails exactly when it matters (a crash mid-operation), which is why the atomic version is what's tested against.

## Why lock() doesn't also freeze incoming credits

A wallet gets locked because something about its *outbound* activity looks wrong (fraud signal, admin investigation). If a purchase this same user made yesterday gets refunded while their wallet is locked, that refund reversal still needs to land — otherwise a locked wallet could end up in a state where legitimate corrective ledger entries can never apply, which would make the lock itself a source of data inconsistency rather than a clean pause. `WalletSecurityService.assertNotLocked` is only called from spend/transfer paths, never from `credit`/`applyLedgerMutation` generally.

## Testing

- `wallet-transfer.spec.ts` — the atomicity guarantee: exact-amount movement between two wallets in one operation, rejection with both wallets left completely untouched when the sender can't afford it (no partial credit), rejection of non-positive amounts, and on-the-fly wallet creation for a recipient who's never received coins before.
- `coin-transfer.service.spec.ts` — every guard rail: self-transfer rejection, blocked-relationship rejection, locked-wallet rejection, daily-limit rejection (including cumulative spend across multiple transfers within the same day), and the flag-but-don't-block behavior for a detected structuring pattern.
- **Not yet covered**: `WalletSecurityService` and `WalletFraudService` don't have dedicated unit test files of their own — their behavior is exercised indirectly through `coin-transfer.service.spec.ts`'s mocks. Direct tests (e.g. confirming `lock()` actually writes an audit log entry) are a reasonable next addition.

## Explicitly not built

- **Automated wallet-lock triggering** — the fraud signals (velocity, structuring) currently only flag transfers for human review; nothing in this codebase automatically calls `WalletSecurityService.lock()` off those signals yet. Wiring that up is a policy decision (how many flags before auto-lock, false-positive tolerance) as much as an engineering one, deliberately left for a follow-up with real usage data to calibrate against.
- **Cross-currency or cross-region coin handling** — coins are a single unitless integer balance; no multi-currency coin denomination exists or is planned in this stage.
- **Any cash-out path** — see the top-of-document boundary; unchanged from Stage 6.
