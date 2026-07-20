# PROFILE.md — Profile Customization (Stage 10)

## Most of this stage already existed — here's what's actually new

Stage 7 (Premium) already built Animated Profile, Profile Themes, Premium Frames, Animated Frames, Premium Username Colors, Status beside username, and Video Avatar. Stage 8 built Gift Showcase. Re-reading the Stage 10 request against what's already shipped, the genuinely new work is:

- **Banner / Animated Banner** — a new `CosmeticItem` category (`banner`), following the exact same pattern as theme/frame (Stage 7's unification already generalizes to this — no new mechanism needed, just a new category value).
- **Animated Themes / Animated Username Colors** — not new mechanisms either: Stage 7's `CosmeticItem.isAnimated` flag already applies uniformly across every category, `theme` and `username_color` included. `GET /premium/cosmetics/theme/catalog?animatedOnly=true` already works today without any Stage 10 code change.
- **Status Icons** — a new `CosmeticItem` category (`status_icon`), same pattern, distinct from the freeform `statusEmoji` text field (Stage 7) — a curated icon set vs. arbitrary emoji.
- **Badge Showcase** — genuinely new: Stage 7's badge is a single *active* selection (what shows beside your username right now); Badge Showcase is a *gallery* of multiple badges a user wants to display, the same "equipped vs. collection display" split Gift Showcase already has relative to Gift Inventory (Stage 8).
- **Achievements Showcase** — required building the Achievements system itself first (catalog, earning, per-user records), since nothing achievement-related existed before this stage.
- **Premium Showcase** — interpreted as the aggregate: one endpoint that renders a full profile's customization (every cosmetic category + status + showcases) in a single call, rather than a client needing five-plus separate requests to paint one profile screen.

## Why this is a new module, not added to Premium or Gifts

`ProfileCustomizationService` (the Premium Showcase aggregator) needs to read from both `PremiumModule` (cosmetics, status, video avatar) and `GiftsModule` (gift showcase). `GiftsModule` already imports `PremiumModule` (Stage 8, for showcase slot limits). If the aggregator lived inside `PremiumModule`, `PremiumModule` would need to import `GiftsModule` — which already imports `PremiumModule` — a circular module dependency NestJS can't resolve. Putting the aggregator in a new top-level `ProfileCustomizationModule` that imports both existing modules (neither of which imports it back) avoids the cycle entirely. This is purely a module-graph consideration, not a reflection of any deeper conceptual boundary — the aggregator itself contains no business rules of its own, it only composes calls to services that already enforce their own rules.

## Achievements: what's built vs. what's a deliberate follow-up

Built: the catalog (`Achievement`), the earned-record table (`UserAchievement`), an idempotent `grant()` primitive (re-granting the same achievement is a silent no-op, never a duplicate or an error), and a manual admin-grant endpoint.

**Not built**: automated achievement *triggers*. Nothing in this codebase currently emits "user hit 100 followers" or "user sent their first gift" as an event that `AchievementsService.grant()` listens for. That wiring is naturally scattered across many other modules (Users for follower-count milestones, Gifts for gifting milestones, Posts for content milestones) and is exactly the kind of cross-cutting event-listener work that should happen once the actual achievement list (and its trigger conditions) is product-defined — building speculative triggers for achievements nobody's decided on yet would be exactly the kind of premature, unrequested work this project's own stated principles (doc 03, doc 50) argue against. The `grant()` primitive and admin endpoint are what real trigger logic will call once that list exists.

## Feature → implementation map

| Requested feature | Implementation |
|---|---|
| Animated Profile | Already built, Stage 7 (`UserProfileExtras.animatedProfileEnabled`) |
| Profile Themes / Animated Themes | Already built, Stage 7 (`CosmeticItem(category='theme')` + `isAnimated`) |
| Profile Frames / Animated Frames | Already built, Stage 7 (`category='frame'`) |
| Banner / Animated Banner | **New**: `CosmeticItem(category='banner')` |
| Username Colors / Animated Username Colors | Already built, Stage 7 (`category='username_color'` + `isAnimated`) |
| Status beside username | Already built, Stage 7 (`UserProfileExtras.statusText/statusEmoji`) |
| Status Icons | **New**: `CosmeticItem(category='status_icon')` |
| Status Emoji | Already built, Stage 7 |
| Video Avatar | Already built, Stage 7 |
| Gift Showcase | Already built, Stage 8 — surfaced here via the Premium Showcase aggregate |
| Achievements Showcase | **New**: `Achievement` + `UserAchievement` + `AchievementShowcaseSlot` |
| Badge Showcase | **New**: `BadgeShowcaseSlot` — distinct from the single active-badge selection |
| Premium Showcase | **New**: `ProfileCustomizationService.getFullDisplay()` — `GET /profile-customization/:userId` |
| Testing | `test/unit/achievements.service.spec.ts`, `test/unit/profile-showcase.spec.ts` |
| Documentation | This file |

## A routing bug worth naming (caught before shipping, not after)

`ProfileCustomizationController` has both a catch-all `GET /profile-customization/:userId` (the Premium Showcase endpoint) and static routes like `GET /profile-customization/achievements/catalog`. NestJS/Express match routes in declaration order — if `:userId` had been declared first, a request for `/achievements/catalog` would have matched it with `userId="achievements"` and never reached the real catalog route, silently returning a full-profile-display response for a nonexistent user instead of the achievement catalog. Every static-prefixed route is declared before the `:userId` catch-all specifically to avoid this; the comment at the top of the controller documents why, so a future edit that adds a new route doesn't accidentally reintroduce the bug by inserting it in the wrong place.

## Testing

- `achievements.service.spec.ts` — the idempotency guarantee: granting an already-earned achievement is a silent no-op (no duplicate row, no duplicate notification), not an error and not a second grant.
- `profile-showcase.spec.ts` — both showcase services: tier-based slot limits, catalog/ownership verification (can't showcase a badge that doesn't exist or an achievement you haven't earned), and the premium-gating check specifically for badges (which — unlike gifts — aren't individually owned items, entitlement is subscription-wide, so the check is "are you currently premium," not "is this in your inventory").

## Explicitly not built

- Automated achievement triggers (see above).
- Wiring the Premium Showcase response into existing Posts/Feed/Comments author objects — same standing follow-up noted in PREMIUM.md and GIFTS.md; this remains its own endpoint for now.
- Banner/status-icon *rendering* — these are server-side catalog + selection only; actual visual rendering (how an animated banner plays, how a status icon is laid out next to text) is client-side work following doc 16's motion tokens, same as every other "animated" cosmetic in this system.
