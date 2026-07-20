# 16 — Animations

## Principles
- Motion serves orientation and feedback, not decoration — every animation in this doc answers "what does this help the user understand," per the frontend-design guidance against scattered ambient effects.
- One orchestrated signature moment (the ring expansion, below) carries the system's "boldness"; everything else is quick, quiet, and consistent.
- `prefers-reduced-motion` (web) / reduce-motion accessibility setting (iOS/Android) is respected everywhere — reduced-motion mode swaps expansions/parallax for simple crossfades, never removes feedback entirely (a state change must still be perceivable, just not via large-scale movement).

## Duration & Easing Tokens
| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion.instant` | 100ms | linear | Button press feedback, toggle states |
| `motion.fast` | 180ms | ease-out | List item selection, tab switches |
| `motion.base` | 240ms | cubic-bezier(0.2, 0.8, 0.2, 1) | Sheet/modal open-close, card expansion |
| `motion.slow` | 400ms | cubic-bezier(0.2, 0.8, 0.2, 1) | Signature ring-expansion transition |
| `motion.ambient` | 1200ms loop | ease-in-out | Typing indicator dots, upload progress ring pulse |

## Signature Moment: Ring Expansion
Opening a story or a chat from its avatar: the circular avatar ring (doc 10/11's Коло motif) expands and morphs into the full-screen surface boundary, rather than the screen simply sliding/fading in. This is the one "real aesthetic risk" of the system — used only for these two entry points (story, chat-from-avatar), not overused elsewhere, so it stays meaningful. Reduced-motion fallback: standard crossfade, ring simply disappears rather than animating.

## Standard Transitions
- Screen navigation (push/pop): platform-native transitions (iOS slide, Android's standard transition) — deliberately *not* custom, since fighting platform navigation conventions is a common source of "uncanny," non-native-feeling app motion the brief explicitly warns against.
- Modals/sheets: slide-up + fade, `motion.base`.
- Tab switch: content crossfade, `motion.fast`, no slide (avoids the "sliding tabs" pattern feeling sluggish at high frequency of use).
- Like button: quick scale-bounce (1 → 1.2 → 1) on tap, `motion.instant` + `motion.fast` sequence — the one micro-interaction given a bit of personality, since it's the single highest-frequency interaction in the app and deserves to feel good without being distracting.
- Optimistic send (chat/post): new item animates in from its origin point (compose button / input field), `motion.fast`, reinforcing that the action was received immediately (ties to NFR-PERF-4).

## Performance Constraints
All animations must run on the native/UI thread where the platform allows (React Native Reanimated worklets on mobile, CSS transforms/opacity only on web — never animate layout-triggering properties like `width`/`top` directly) to hit the 60fps floor / 120fps target from doc 05. Any animation that cannot be verified to hit that floor on the mid-tier reference Android device is simplified, not shipped as-is with a "it's probably fine" assumption.
