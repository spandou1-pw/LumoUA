# PREMIUM.md — Premium Ecosystem (Stage 7)

## Design decision: one entitlement source, one cosmetics model

Every premium feature answers "is this user premium" the same way — `PremiumService.isPremium(userId)`, which reads live subscription status from `SubscriptionsService` (Stage 6). No feature caches or independently re-derives premium status. A lapsed subscription loses access to every premium feature on the very next request, with no separate sync step — this is deliberate: entitlement bugs (a user keeping premium perks after their subscription lapses) are exactly the kind of drift that appears when multiple modules each maintain their own "is premium" check.

Ten of the requested features (**Premium Badge, Animated Badge, Badge Selector, Profile Themes, Premium Frames, Animated Frames, Premium Username Colors, Premium Wallpapers, Premium Profile Effects**) share one underlying shape: *a catalog of items in a category, of which a user picks exactly one active item*. Rather than ten near-identical tables and services, these are all `CosmeticItem` rows differentiated by `category`, with one `UserCosmeticSelection` row per (user, category). "Animated Badge" isn't a separate feature from "Premium Badge" — it's a badge-category item with `isAnimated: true`; the catalog endpoint has an `animatedOnly` filter rather than a whole parallel animated-badge system.

## Feature → implementation map

| Requested feature | Implementation |
|---|---|
| Premium Badge / Animated Badge / Badge Selector | `CosmeticItem(category='badge')` + `CosmeticsService.select/listCatalog` |
| Status beside username | `UserProfileExtras.statusText/statusEmoji` + `ProfileExtrasService` |
| Animated Profile | `UserProfileExtras.animatedProfileEnabled` — a server-side toggle; the animation itself is client rendering (doc 16 motion tokens) |
| Video Avatar | `UserProfileExtras.videoAvatarAssetId`, reusing doc 30's existing video media pipeline (`FilesService.getReadyVideoAssetOwnedBy` verifies ownership + ready status before attaching) |
| Profile Themes | `CosmeticItem(category='theme')`, `config` JSON carries theme color tokens |
| Premium Frames / Animated Frames | `CosmeticItem(category='frame')` |
| Premium Username Colors | `CosmeticItem(category='username_color')`, `config.hex` |
| Premium Emoji / Premium Stickers | `PremiumAssetPack` — a *different* shape from cosmetics: access to a whole pack, not a single selection, since a user uses many stickers/emoji, not one |
| Premium Reactions | `PremiumReaction` — coexists with the Stage 5 `likes` table rather than replacing it; a curated emoji allow-list (`ALLOWED_REACTION_EMOJI`), not free-form input |
| Premium Wallpapers | `CosmeticItem(category='wallpaper')` — selection consumed by the Messenger module when rendering a chat background (integration point, not yet wired into Messages responses — see Follow-ups) |
| Premium Profile Effects | `CosmeticItem(category='profile_effect')` |
| Premium Limits | `PremiumLimitsService` — one static free/premium `LimitSet`, the single place any module asks "what's this user's limit for X" |
| Premium Analytics | `PremiumAnalyticsService` — cosmetic adoption rate, most-popular items per category, premium reaction usage. Revenue/subscription-count analytics already existed from Stage 6 (`PaymentAnalyticsService`) and aren't duplicated here |
| Premium API | `PremiumController` (user-facing) |
| Premium Admin | `PremiumAdminController` — catalog CRUD for cosmetics and asset packs, analytics reads, admin-only (`@Roles(PlatformRole.ADMIN)`) |
| Premium Testing | `test/unit/cosmetics.service.spec.ts`, `test/unit/premium-limits-reactions.spec.ts` |
| Premium Documentation | This file |

## Why gifts/coins (Stage 6) and premium (Stage 7) stay separate systems

Coins are spent on gifts (Stage 6, real coin debit) or could in principle unlock cosmetics too — but Stage 7's cosmetics are gated purely by **subscription status**, not coin spend. This is a deliberate product-shape choice, not an oversight: it keeps "premium" meaning one clear thing (an active subscription) rather than a blend of subscription-gated and coin-purchasable items with different revenue/analytics implications. A future "buy this frame outright with coins, no subscription needed" feature is a plausible extension but would need its own entitlement model (a per-item unlock table) — not bolted onto the current subscription-only gate silently.

## Enforcement pattern

- `PremiumGuard` + `@RequiresPremium()` decorator — for whole endpoints that are entirely premium-gated.
- Per-item gating (`CosmeticItem.requiresPremium`) — for endpoints where *some* items in a catalog are free and some aren't (e.g. a default badge everyone can pick, alongside premium-exclusive ones), checked inside `CosmeticsService.select`, not at the route level.
- Both patterns call the same `PremiumService.isPremium()` underneath — never two different entitlement checks.

## Testing

- `cosmetics.service.spec.ts` — the core premium-gating invariants: rejecting a premium item for a free user, allowing a free item for a free user, allowing a premium item for a premium user, and confirming selection replaces (not duplicates) an existing pick in the same category.
- `premium-limits-reactions.spec.ts` — confirms premium limits are strictly better than free limits (not just "different"), and that premium reactions reject both non-premium users and emoji outside the curated allow-list.
- **Not yet covered**: integration test hitting the real `/premium/*` HTTP endpoints against Postgres (the pattern is established in `test/integration/wallet-gifts.integration-spec.ts` from Stage 6 — a straightforward next addition, not built here to keep this stage's scope to the feature set itself).

## Follow-ups (explicitly not built in this pass)

- **Wiring display bundles into existing responses**: `CosmeticsService.getDisplayBundle()` and `ProfileExtrasService.getPublicDisplay()` exist and are callable, but Posts/Feed/Comments/Messages response assembly (Stage 5) doesn't yet call them to embed badge/status/wallpaper info inline. Right now a client fetches them via separate `GET /premium/display/:userId` calls. Wiring this into the existing `assemble()` methods (doc 27 pattern) is the natural next increment once it's clear which surfaces actually need inline cosmetic data vs. fetching on demand.
- **Per-item unlock without a subscription** (buy a single cosmetic with coins) — a distinct entitlement model, not built (see above).
- **Chat wallpaper rendering** — the selection exists server-side; Messenger doesn't yet read it when assembling a conversation view.
