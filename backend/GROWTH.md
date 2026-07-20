# GROWTH.md — Growth System (Stage 16)

## What already existed vs. what's genuinely new

| Requested item | Status before this stage | This stage |
|---|---|---|
| Achievements | ✅ Fully built, Stage 10 | **Reused, not duplicated** — Founder Program grants an Achievement row rather than building a parallel badge mechanism |
| Feature Flags | ✅ Fully built, Stage 13 | Unchanged |
| Gift Analytics | ✅ Fully built, Stage 8 | Unchanged — not duplicated by Creator Dashboard's gift summary, which reads the same `GiftTransaction` table for a different (self-scoped, non-admin) purpose |
| A/B Testing | ❌ Explicitly flagged "not attempted" in SECURITY.md (Stage 15) | **Built for real** — deterministic multi-variant assignment, exposure/conversion logging, honest (no fake significance testing) results |
| Referral System / Invite Friends / Referral Rewards | ❌ Not built | **Built**: stable per-user codes, qualification-gated rewards (email verification, not bare signup, to resist farming) |
| Founder Program | ❌ Not built | **Built**, reusing Achievements (see above) |
| Daily/Weekly Missions | ❌ Not built | **Built**: data-driven mission definitions, real ISO-week period calculation, capped progress, idempotent reward |
| Seasonal Events | 🟡 Partially covered by Stage 8's Seasonal Gifts (`season_tag`) | **Extended**: missions can share the same `season_tag` concept — no new mechanism invented |
| Creator Dashboard / Creator Monetization | ❌ Not built | **Built** — read-only visibility, explicitly not a payout mechanism (see boundary below) |
| Community Growth | ❌ Not built | **Built**: real member-growth-over-time query |
| Retention System | ❌ Not built | **Built**: real D1/D7/D30 cohort retention from actual signup + session-activity data |
| Push Campaigns | 🟡 Stage 13's `Announcements` covers broadcast-to-everyone | **Built**: segmented targeting (`inactive_7d`, `non_premium`, etc.) as real SQL predicates, not a separate broadcast mechanism |
| Email Campaigns | ❌ Not built | **Built** — real orchestration, stubbed send (needs a real provider, same honest pattern as every external dependency) |
| Premium Conversion Analytics | ❌ Not built | **Built** — added to the existing `PaymentAnalyticsService` (Stage 6), not a new module |
| Funnels | ❌ Not built | **Built**: generic event log + real ordered-funnel conversion computation |
| Crash Analytics | ❌ Not built | **Built**: real ingestion + aggregation endpoint (client SDK integration is separate — see note) |
| Performance Analytics | ❌ Not built | **Built**: real client-reported metric ingestion + real p50/p95/p99 computation |

## Creator Monetization — the boundary is unchanged, stated once more plainly

`CreatorDashboardService.overview()` shows a user their own post/follower growth and the **notional** coin-value of gifts they've received. It does not add any way to convert that notional value into real money. This is the same Stage 6/8 boundary, not a new decision: coins are non-redeemable, and the notional gift-value ledger entry (`gift_received_notional`) this dashboard reads from has never had — and doesn't gain here — any code path that credits a real, spendable balance. If "Creator Monetization" is meant to eventually include real payouts to creators, that remains the explicitly-flagged, not-built Stripe Connect feature from PAYMENTS.md. This dashboard is the visibility layer that would sit in front of such a feature; it is not the feature.

## How the new growth hooks connect to existing code without new coupling

`AuthService` now emits `user.registered` (carrying an optional referral code) and `user.email_verified` — two new domain events, following the exact pattern `PostsService`/`GiftsService` already established (Stage 5/8's `post.created`, etc.). `ReferralEventsListener` and `FounderProgramService` both listen for these rather than `AuthService` importing and calling either feature directly. This keeps `AuthModule` foundational and free of a dependency on growth features built on top of it — the same reasoning that led every prior stage to prefer event listeners over direct cross-module service calls wherever the relationship is "notify me when X happens" rather than "I need X's return value right now."

## A/B Testing — real, and honestly limited

`assignVariant()` is the same deterministic-hash-bucketing principle as `FeatureFlagsService` (Stage 13), generalized from binary on/off to N weighted variants — tested for determinism, cross-experiment independence, and (statistically, over many users) respecting configured weight ratios. `AbTestingService.results()` computes real exposure/conversion counts and rates per variant.

What's deliberately NOT included: statistical significance testing (chi-squared, p-values, confidence intervals). Presenting a "significant!" claim without a considered decision about this platform's actual traffic/variance characteristics risks a confidently-wrong result being acted on. A real significance calculation is a legitimate, valuable next addition — it needs a deliberate library/methodology choice, not a default assumed here just to check a box.

## Retention — a real definition, not a placeholder metric

"D7 retained" means exactly what it says: the user's last known activity (`MAX(refresh_tokens.last_used_at)` across their devices — Stage 15's real session-tracking field) is at least 7 days after their signup date. This reuses data two other stages already built for other reasons (Stage 15's device sessions, Stage 4's `users.created_at`) rather than inventing a new activity-tracking mechanism — consistent with how `CampaignsService`'s `inactive_7d` segment reuses the exact same signal.

## Testing

- `mission-period.calculator.spec.ts` — daily/weekly boundary correctness, including the ISO-week year-boundary edge case (Jan 1 can belong to the prior year's week 53) that a naive implementation commonly gets wrong.
- `variant-assignment.spec.ts` — determinism, cross-user spread, cross-experiment independence, 100/0 edge case, and statistical weight-ratio adherence over a real sample.
- `percentile.spec.ts` — p0/p50/p100 exact cases, interpolation between indices, empty-array handling.
- `missions.service.spec.ts` — no-op for an unknown mission key, progress accumulation without premature completion, exactly-once reward on reaching target, no further progress/double-reward after completion, and progress capping.
- `referrals.service.spec.ts` — unknown-code handling, self-referral rejection, and the qualification reward flow (both parties rewarded once, idempotent via the pending-status-only query).

## Explicitly not built

- Real statistical significance testing for A/B results — see above.
- Client-side crash-reporting SDK integration (Sentry or equivalent) in the mobile/web apps — this stage builds the backend ingestion/aggregation only; MOBILE.md/WEB_DESKTOP.md's existing gaps here are unchanged.
- Actual email delivery — `EmailProvider` is a real orchestration shell needing a real provider API key, same pattern as every other external dependency across this project.
- A disposable/farmable-referral detection layer beyond the email-verification qualification gate — a determined bad actor could still create many verified throwaway accounts; deeper fraud detection here would reuse Stage 14/15's existing fake-account/bot-detection services, not a new mechanism, and wasn't wired into the referral flow in this pass.
