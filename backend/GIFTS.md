# GIFTS.md — Gift Ecosystem (Stage 8)

## Two design decisions everything else follows

**1. No randomness, ever.** Rare/Legendary/Limited/Seasonal are catalog *attributes* on a deterministic item — you always know exactly what you're buying and what it costs in coins before you send it. There is no "mystery box," no random-pull mechanic, no chance-based reward anywhere in this module. That's a deliberate boundary, not an oversight: randomized virtual-item mechanics tied to real-money-purchased currency is the shape that draws loot-box/gambling regulation in a growing number of jurisdictions (the same reasoning as doc PAYMENTS.md's Coins/Gifts boundary, extended here to the catalog design itself).

**2. The non-redemption boundary from Stage 6 is unchanged.** Receiving a gift adds it to the recipient's inventory (a collectible/display record) — it does **not** credit their spendable coin balance, and there is no gift-trading or gift-to-coins conversion anywhere in this module. `GiftsService.send()` still only ever calls `wallet.debit()` on the sender and a zero-impact notional ledger row on the recipient, exactly as in Stage 6.

## Architecture: ledger + cache, twice

This module uses the same pattern twice, deliberately consistent with Stage 6's Wallet design:

- **Gifts**: `GiftTransaction` (append-only — every send, who/what/when) is the source of truth; `UserGiftInventory` (per-user, per-item quantity) is a materialized cache, updated only inside the same DB transaction as the `GiftTransaction` insert (`GiftInventoryService.incrementWithinTransaction`, called with the transaction's `EntityManager`, not a fresh connection).
- **Limited supply**: `GiftCatalogItem.remainingSupply` is decremented via a single atomic conditional `UPDATE ... WHERE remaining_supply > 0`, not a read-then-write — this is what actually prevents overselling a scarce item under concurrent sends (two people buying the "last" legendary gift at the same moment: exactly one succeeds, the other gets a clean `GIFT_SOLD_OUT`, not a corrupted negative-stock count). Tested explicitly in `test/unit/gifts-availability.spec.ts`.

## Feature → implementation map

| Requested feature | Implementation |
|---|---|
| Gift Store | `GET /gifts/store` — `GiftCatalogService.browse()`, filterable |
| Gift Categories | `GiftCategory` entity + `GET /gifts/categories` |
| Animated Gifts | `GiftCatalogItem.isAnimated` + `animationUrl`, filterable via `animatedOnly` |
| Limited Gifts | `GiftCatalogItem.totalSupply`/`remainingSupply`, atomic decrement on send |
| Rare Gifts / Legendary Gifts | `GiftCatalogItem.rarity` enum + `GET /gifts/store/rare` \| `/legendary` shortcuts |
| Seasonal Gifts | `seasonTag` + `availableFrom`/`availableUntil` window, `GET /gifts/store/seasonal` groups by tag |
| Gift Inventory | `UserGiftInventory`, `GET /gifts/inventory/me` \| `/:userId` |
| Gift Collection | `GiftInventoryService.collectionSummary()` — distinct items owned + total received, a "completeness" lens on the same inventory data |
| Gift Showcase | `GiftShowcaseSlot` — pin owned gifts to profile-visible slots; slot count comes from `PremiumLimitsService.maxGiftShowcaseSlots` (Stage 7 cross-reference: free=3, premium=12) |
| Gift History | `GET /gifts/history/sent` \| `/received`, cursor-paginated (replaces Stage 6's unpaginated version) |
| Gift Sending / Receiving | `GiftsService.send()` — availability window + supply check + debit + transactional inventory update + notification |
| Gift Search | `q` param on `GET /gifts/store`, `ILIKE` match on name |
| Gift API | `GiftsController` (user-facing) |
| Gift Analytics | `GiftAnalyticsService` — top gifts, rarity distribution, seasonal performance, unique senders/recipients. Revenue-in-USD analytics already exists from Stage 6 (`PaymentAnalyticsService`) and isn't duplicated here — this is gift-specific engagement/volume, not money |
| Gift Moderation | `GiftModerationService` — hide/unhide a gift's public visibility (e.g. abusive attached message), **does not** reverse the coin transaction (that's `RefundsService`, a distinct action with distinct consequences) — every action audit-logged (doc 24) |
| Gift Administration | `GiftAdminController` — category/catalog CRUD, explicit restock action (`addToRemainingSupply`, not a raw field overwrite that could reset stock to a stale total), admin-only |
| Testing | `test/unit/gifts-availability.spec.ts`, `test/unit/gift-showcase.spec.ts` |
| Documentation | This file |

## Why moderation and refunds are separate actions

Hiding a gift (`GiftModerationService.hide`) only changes visibility — the sender already spent real coins and the recipient's inventory already has the item; neither is touched. A moderator hiding an abusive message shouldn't have side effects on anyone's coin balance or collection. If the underlying purchase itself needs reversing (e.g. it was fraudulent), that's `RefundsService.adminRefundStripePurchase` from Stage 6 — a deliberately distinct code path with its own audit trail, because "this content is inappropriate" and "this transaction should be undone" are different admin judgment calls with different consequences, and conflating them risks an admin hiding content accidentally also clawing back coins (or vice versa).

## Testing

- `gifts-availability.spec.ts` — the highest-value test file: confirms self-gifting and blocked-user rejection, availability-window enforcement (both not-yet-started and expired), the sold-out atomic-decrement path (`affected: 0` → `ConflictException`, wallet never debited), a successful limited-gift send updating supply/wallet/inventory together, and that unlimited gifts never touch the supply-decrement code path at all.
- `gift-showcase.spec.ts` — slot-limit enforcement tied to premium tier, ownership verification (can't showcase a gift you don't have), and the free-vs-premium slot-count difference end to end.
- **Not yet covered**: an integration test hitting real `/gifts/store` filters and `/gifts/showcase` against Postgres (the established pattern from Stage 6's `wallet-gifts.integration-spec.ts` extends naturally here — a reasonable next addition, not built in this pass to keep scope to the feature set itself).

## Explicitly not built

- **Gift trading/marketplace between users** — reintroduces value-transfer-between-users concerns the non-redemption boundary exists to avoid. Not in the requested feature list either.
- **Randomized/gacha gift acquisition** — see the top-of-document boundary.
- **Wiring showcase/badge display into Posts/Feed/Comments response assembly** — same follow-up noted in PREMIUM.md; `GET /gifts/showcase/:userId` exists as its own endpoint, not yet embedded inline into profile/post author objects.
