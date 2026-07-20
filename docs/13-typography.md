# 13 — Typography

## Typeface Roles
| Role | Face | Why |
|---|---|---|
| Display | **Fixel Display** (variable) | Ukrainian-foundry typeface designed with Cyrillic as a first-class citizen, not a Latin face with Cyrillic glyphs added later — matters for a product where Ukrainian is the *default*, not a localization afterthought. Distinctive geometric character fits "premium, modern, minimal." |
| Body | **Golos Text** (variable) | Ukrainian-made humanist sans built for UI legibility at small sizes; strong hinting for both Cyrillic and Latin scripts (needed since English is the secondary language, not absent). |
| Utility/Mono | **JetBrains Mono** | Timestamps, usernames/handles, IDs, admin-panel data tables — clear digit and character disambiguation at small sizes. |

Fallback stack (all roles): system UI font stack (`-apple-system`, `Roboto`, `Segoe UI`, sans-serif) if the custom fonts fail to load, to avoid FOIT/invisible text on slow connections — consistent with the NFR-PERF-4 graceful-degradation requirement.

## Type Scale (base 16px / 1rem, 8pt-aligned line-heights)
| Token | Size | Line height | Weight | Face | Use |
|---|---|---|---|---|---|
| `display.xl` | 34px | 40px | 600 | Fixel Display | Onboarding hero, empty-state headlines |
| `display.lg` | 28px | 34px | 600 | Fixel Display | Screen titles |
| `display.md` | 22px | 28px | 500 | Fixel Display | Section headers, modal titles |
| `body.lg` | 17px | 24px | 400 | Golos Text | Primary reading size — post text, message bubbles |
| `body.md` | 15px | 20px | 400 | Golos Text | Secondary content, comments |
| `body.sm` | 13px | 18px | 400 | Golos Text | Captions, metadata, timestamps (paired with `text.secondary` color) |
| `label.md` | 15px | 20px | 600 | Golos Text | Buttons, tab labels, form labels |
| `label.sm` | 12px | 16px | 600 | Golos Text | Chips, badges |
| `mono.sm` | 13px | 18px | 400 | JetBrains Mono | Handles, IDs, admin data |

## Rules
- Never mix Fixel Display into body copy longer than ~2 lines — it's a display face, legibility degrades at paragraph length.
- Minimum body text size across the app: 13px (`body.sm`) — nothing smaller, per accessibility floor (doc 47).
- Line length target for `body.lg`/`body.md` on wide (web/tablet) layouts: 60–75 characters — feed/chat columns are width-constrained specifically to hold this line length, not left to stretch full-bleed.
- Cyrillic-specific: verify both faces' Cyrillic italics/bold render correctly (variable font axis testing) before Phase 1 UI lock — a known risk area since many "global" type systems under-test non-Latin styles.

## Localization Note
English strings tend to run 15–20% shorter than Ukrainian for the same UI label (a known pattern for Slavic languages with more inflected/compound forms). Button and label components must be built to accommodate this (no fixed-width truncated buttons) — this is a layout requirement flowing directly from doc 05's i18n rules, not a cosmetic detail.
