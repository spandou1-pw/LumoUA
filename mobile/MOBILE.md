# MOBILE.md — Mobile Platform (Stage 11)

## What was actually verified vs. what couldn't be

This sandbox has no Xcode, no Android SDK, and no iOS/Android simulator — so unlike every backend stage, I could not actually boot this app on a device or simulator to confirm it runs end-to-end, including the Premium/Gift Store/Notifications/Messenger screens added in this follow-up pass. What I *could* and did verify:

- `npx tsc --noEmit` — **0 errors** across the whole app (real TypeScript, real import graph, real React Navigation/React Query type usage — not pseudocode).
- `npx jest` — **12/12 tests pass**, using the real `jest-expo` preset and `@testing-library/react-native` (not a fake test harness — this exercises real component rendering, press events, and accessibility props).
- Every screen calls the real Stage 4–10 backend endpoints with the real request/response shapes those APIs return (cross-checked against the NestJS DTOs, not guessed).

What remains unverified: actual on-device rendering, gesture feel, real network behavior against a running backend, and native module linking (Reanimated, SecureStore, FlashList all require native builds this sandbox can't produce). Running `npx expo start` and opening it in Expo Go / a simulator is the next real verification step, and belongs to an environment with that tooling.

## Scope reality (same reasoning as every previous stage)

Full production-ready coverage of all 20 requested screens — every animation, every transition, every loading/error state, native IAP wiring, and live voice/video calling — is not something to fake-complete in one pass. This batch prioritizes **real, working depth** on a representative slice over shallow stubs everywhere:

| Screen | Status | Notes |
|---|---|---|
| Splash | ✅ Built | Real ring-rotation animation (Reanimated), real session check against `GET /users/me` |
| Onboarding | ✅ Built | Swipeable carousel, animated dot indicator |
| Login | ✅ Built | Real form, real API error-code mapping, loading state |
| Registration | ✅ Built | Two-step (credentials → verify code), matches doc 08 flow 1 exactly, now supports an optional referral code |
| Feed | ✅ Built | Full loading (skeleton) / error (retry) / empty (CTA) states, infinite scroll, pull-to-refresh, optimistic like |
| Profile | ✅ Built | Pulls the Stage 10 Premium Showcase aggregate in one call; loading/error states |
| Wallet / Coins | ✅ Built | Balance, paginated ledger history, locked-wallet notice; loading/error/empty states |
| Settings | ✅ Built (basic) | Section list + real logout call |
| Premium | ✅ Built (this pass) | Status, upsell, cosmetics catalog by category, select flow — not yet on the tab bar (6 tabs already; reachable via a future Profile-screen link) |
| Gift Store | ✅ Built (this pass) | Rarity filter, real send flow — takes a `recipientId` prop; not yet wired to a "choose recipient" flow from a user's profile |
| Notifications | ✅ Built (this pass) | Infinite scroll, read/unread styling, 30s poll |
| Messenger (conversation list) | 🟡 Built (this pass), metadata only | Real participant/unread/last-activity data; **no message content** — see the E2E note below, unchanged from the original assessment |
| Voice Calls / Video Calls | 🟡 Honest placeholder | Backend has no call-signaling endpoint yet (`API_PLATFORM.md`: Calls "Not started") |
| Stories | ❌ Not built | Backend Stories API also not built |
| Channels | ❌ Not built | Backend Channels not built either |
| Communities | ❌ Not built | Backend exists (Stage 4); not wired this pass |
| Search | ❌ Not built | Backend Search not built (needs Elasticsearch) |
| Payments (native IAP) | ❌ Not built | Backend Stripe path is real; native `expo-in-app-purchases`/StoreKit wiring needs a device build to test at all |
| Accessibility | 🟡 Partial | See below |

## Why Calls gets a placeholder instead of a stub that "looks done"

A call button that's tappable but silently does nothing is worse than one that's honest about not working yet — it reads as a bug in an otherwise-functional app rather than a known limitation. `CallScreenPlaceholder` says plainly that calling isn't live and explains why (no backend signaling), rather than presenting fake ringing/connecting UI with no real WebRTC session behind it.

## Architecture decisions (doc 17 compliance)

- **State split**: Zustand (`authStore`) holds only "am I logged in" — never cached server data. All server data (feed, wallet, profile) lives in React Query, matching doc 17's explicit split.
- **Secure token storage**: refresh token in `expo-secure-store` (Keychain/Keystore), access token in memory only, never persisted — per doc 17/23.
- **Design tokens as code**: `theme/tokens.ts` is a direct port of doc 10/12/13's values — colors, spacing, motion durations all sourced from there, no inline hex/px values in components (doc 10's governance rule, carried into the mobile codebase).
- **Optimistic updates**: `useLikePost` updates the feed cache immediately and reconciles from the server in the background (doc 05 NFR-PERF-4), with rollback on error.
- **API client**: single `apiRequest` handles the 401→refresh→retry flow once, centrally — every hook benefits without reimplementing it (mirrors the backend's own "one code path for X" discipline from every prior stage).

## Accessibility — what's actually done vs. a real audit

Done: `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` (disabled/busy) on interactive elements built this stage (`Button`, form inputs, `ErrorState`'s alert role). This is a real start, not a checkbox — it's exercised in `test/Button.test.tsx`'s accessibility-state assertion.

Not done: a full WCAG-equivalent audit (doc 47's standard) — screen-reader flow testing (VoiceOver/TalkBack) on-device, color contrast verification against the actual rendered output, dynamic-type/font-scaling behavior at 200%, and keyboard/switch-control navigation. These require the on-device testing this sandbox can't do, consistent with the verification-scope note at the top of this document.

## Testing

- `test/Button.test.tsx` — render, press, disabled-blocks-press, loading-blocks-press-and-hides-label, accessibility state.
- `test/StateViews.test.tsx` — the "never a dead end" contract (doc 08): error state with/without retry, empty state with/without action, and that the action callbacks actually fire.
- `test/authStore.test.ts` — auth state transitions.
- **Not yet covered**: screen-level integration tests (e.g. mocking the API client and testing `FeedScreen`'s full loading→data→error flow) — a reasonable next addition once the component-level foundation above is extended.

## Explicitly not built

- Messenger, Stories, Channels, Communities, Notifications, Search, Premium (dedicated screen), Gift Store, native Payments — see the status table. Each is blocked on either backend readiness (Stories/Channels/Search) or simply wasn't reached in this pass despite the backend being ready (Messenger/Communities/Notifications/Premium/Gifts) — the distinction matters for prioritizing what to build next.
- Voice/Video calling — blocked on backend WebRTC signaling not existing yet, not a mobile-side gap.
- On-device verification of anything in this stage — see the top of this document.
