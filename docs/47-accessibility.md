# 47 — Accessibility

Consolidates accessibility requirements referenced throughout earlier docs (doc 05 NFR-A11Y-*, doc 10/11/12/13/14/38's per-area notes) into the canonical, actionable standard.

## Standard
WCAG 2.1 AA baseline across mobile and web (doc 05) — chosen as the realistic, well-supported target for a product this size; AAA is not pursued as a blanket target (some AAA criteria trade off against other design goals in ways not clearly justified for this product), but individual AAA criteria are adopted where they're low-cost (e.g. enhanced contrast ratios where the palette already supports it, per doc 12).

## Visual
- Color contrast: text ≥ 4.5:1 (body), ≥ 3:1 (large text/UI components) against its background — verified per doc 12's contrast matrix, generated and CI-checked (doc 36) rather than hand-verified once and left to drift as the palette evolves.
- Color is never the sole information carrier (doc 14) — every status/state distinction (read/unread, error/success) pairs color with shape, icon, or text.
- Text resizing: UI supports platform-level text-size scaling (Dynamic Type on iOS, font scale on Android, browser zoom on web) without breaking layout — tested at 200% zoom/scale as a concrete check, not just "should probably work."
- Minimum touch target: 44×44pt (doc 11), enforced at the primitive component level so no feature-level implementation can accidentally ship a smaller tap target.

## Screen Reader Support
- All interactive elements have accessible labels (not relying on visual-only icon meaning — doc 14's icons paired with `accessibilityLabel`/`aria-label` reflecting their function, e.g. "Like post" not "heart icon").
- Semantic structure: proper heading hierarchy (web), proper accessibility roles/traits (mobile: `accessibilityRole`) so screen reader users can navigate by structure, not just linearly through every element.
- Dynamic content announcements: new messages arriving in an open chat, feed updates, and toast/snackbar confirmations (doc 11) are announced via live regions (web `aria-live`) / accessibility announcements (mobile), not silently updated on-screen only.
- Full VoiceOver/TalkBack testing (not just automated `axe-core` checks, doc 38) required for the core flows by end of Phase 2 per doc 05's NFR-A11Y-2 deadline: onboarding, feed browsing, sending a message, posting.

## Motion
`prefers-reduced-motion`/reduce-motion OS setting respected everywhere (doc 16) — every animation, including the signature ring-expansion moment, has a defined reduced-motion fallback that still conveys the state change, never a fallback of "just skip the feedback entirely."

## Keyboard (Web-Specific, doc 19)
Full keyboard operability: every mouse-accessible action has a keyboard path, visible focus indicators on every interactive element (never `outline: none` without a replacement, doc 11), logical tab order matching visual reading order, and no keyboard traps (a user can always tab out of any component, including modals — closeable via `Escape`).

## Forms
Every input has an associated, programmatically-linked label (not placeholder-text-as-label, which disappears on input and isn't reliably read by all screen readers) — error messages are associated with their field via `aria-describedby`/platform equivalent and announced on validation failure, not just shown visually.

## Testing & Ongoing Verification
Per doc 38: automated `axe-core` checks integrated into E2E test runs catch a baseline continuously; manual audits scheduled at the same cadence as doc 43's capacity-planning review, since accessibility, like performance, degrades silently as new features ship if not actively re-verified — it is not a one-time certification.

## Ownership
Accessibility is a review criterion in the standard PR process (doc 41), not a separate late-stage audit pass — the UI Kit's primitive-level enforcement (doc 11) is specifically designed so most accessibility correctness is inherited "for free" by any feature built from the kit, with review attention focused on the feature-specific gaps that inheritance can't cover (custom interactions, dynamic content announcements).
