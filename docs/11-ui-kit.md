# 11 — UI Kit

Scope: the reusable primitive layer beneath doc 15 (Components). Everything here is a building block; doc 15 covers assembled, feature-specific components (e.g. "post card," "chat bubble").

## Primitives
- **Button**: variants `primary` (wheat fill, `text.onAccent`), `secondary` (chicory outline), `tertiary` (text-only), `destructive` (error color). Sizes: `sm` (32px height), `md` (44px height — meets the 44pt touch target floor from doc 05), `lg` (52px, used sparingly for single primary CTAs like onboarding). No fixed width — always sized to content + padding, per the typography localization note.
- **Input**: text field, textarea, OTP/code input (used in email verification, doc 08 flow 1). All inputs use `radius.small` (8px), 1px border in `text.secondary` at rest, `chicory` on focus — focus ring is always visible (never `outline: none` without a replacement, per accessibility floor).
- **Avatar**: circular, sizes `xs`(24px)/`sm`(32px)/`md`(40px)/`lg`(64px)/`xl`(96px, profile header). Optional **ring** (the Коло motif) — states: none, `unseen-story` (wheat gradient ring), `seen-story` (chicory ring), `live` (animated pulse variant, reserved for future live/streaming features, not built in Phase 1).
- **Chip/Tag**: `radius.full`, used for hashtags, filter selections, community categories.
- **Card**: `radius.medium` (16px), elevation-1 surface — the base container for post cards, community cards, search result cards.
- **Badge**: small numeric/dot indicator for unread counts — dot-only where the number isn't actionable information (e.g. "someone new followed you" doesn't need a number), numeric where it is (unread message count).
- **Bottom Sheet / Modal**: elevation-2 surface, used for Compose, Report flow, and settings sub-screens on mobile; equivalent web pattern is a centered modal for narrow actions, inline panel for wider ones (e.g. image viewer).
- **Toast/Snackbar**: transient confirmation ("Published", "Copied") — matches the interface-voice rule from doc 10/copy guidance: states what happened, not an apology or exclamation-heavy tone.
- **Skeleton Loader**: used for feed/chat list loading states instead of a spinner where content shape is predictable — spinners (built from the ring motif) reserved for indeterminate actions (uploads, sending).
- **Empty State**: icon/illustration + `display.md` headline + one line of body copy + a single clear action — never a dead end (per doc 08's onboarding flow note).

## Composition Rules
- Spacing between primitives always from the `space.*` scale (doc 10) — no arbitrary pixel values in component code.
- Every interactive primitive has: default, hover (web only), pressed, focused, disabled states defined — not just default+disabled, which is a common gap that shows up as "dead-feeling" UI.
- Dark/light mode are not separate component builds — every primitive consumes semantic tokens (`color.surface.*`, `color.text.*`) so theme switching requires zero per-component logic.

## Platform Divergence
React Native (iOS/Android) and Web share the token layer (doc 10) and this primitive spec, but not literal component code — RN primitives are built once and shared between iOS/Android (per the shared React Native/Expo codebase in the tech stack), Web primitives are a separate implementation (likely React + the frontend-design system) kept in visual parity via the shared tokens, not shared JSX, since Web has different interaction affordances (hover, right-click, keyboard shortcuts) that a naive shared-component approach tends to paper over badly.
