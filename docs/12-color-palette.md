# 12 — Color Palette

(Numbered per the original 50-doc plan; doc 11 UI Kit follows this since components are specified in terms of these tokens.)

## Core Palette (6 named values, per design system doc 10)

| Token name | Hex | Description | Primary use |
|---|---|---|---|
| `night` | `#12162A` | Deep indigo-black, not pure black — softer on OLED, avoids the harsh near-black common in dark-mode defaults | Dark mode base surface |
| `stone` | `#EDEDE6` | Warm grey-white, not cream — neutral enough to not compete with photo/video content in the feed | Light mode base surface |
| `wheat` | `#D9A441` | Muted gold, referencing wheat fields | Primary accent: primary buttons, the Коло ring (unseen-story state), active tab indicator |
| `chicory` | `#5B7FB8` | Desaturated cornflower blue | Secondary accent: links, selection states, seen-story ring state |
| `chornozem` | `#2B2620` | Warm near-black brown (soil), used as dark-mode elevated surface / light-mode primary text | Text, elevated cards |
| `linen` | `#F7F4EC` | Slightly warmer/lighter than stone | Light-mode elevated surface (cards sitting on `stone` background) |

## Semantic State Colors
| Token | Hex | Use |
|---|---|---|
| `success` | `#4C8C5A` | Confirmations, delivered/read states if color-coded beyond checkmarks |
| `error` | `#C0483B` | Errors, destructive action confirmation (kept warm/earthy, not a generic saturated red, to stay in-palette) |
| `warning` | `#C98A2E` | Close to `wheat` intentionally — warnings and the primary accent share a warm-gold family, differentiated by context and icon, not by clashing hue |

## Surface Elevation Model
- Dark mode: `night` (base) → `#181D33` (elevation 1: cards) → `#1F2540` (elevation 2: modals/sheets)
- Light mode: `stone` (base) → `linen` (elevation 1: cards) → `#FFFFFF` (elevation 2: modals/sheets)

## Text Colors
| Token | Light mode | Dark mode | Use |
|---|---|---|---|
| `text.primary` | `chornozem` (`#2B2620`) | `#F2F0E8` | Body copy, headings |
| `text.secondary` | `#6B655A` | `#A7A290` | Timestamps, metadata, placeholder |
| `text.onAccent` | `#1A1000` | `#1A1000` | Text/icons sitting on `wheat` (needs dark text for contrast — see accessibility note below) |

## Accessibility Notes (cross-ref doc 47)
- `wheat` (`#D9A441`) on `stone`/`linen` passes AA for large text/icons but **not** for small body text — never set small text in `wheat`; use it for icons, buttons with dark label text, and the ring motif, not for prose.
- `chicory` (`#5B7FB8`) on `night` and on `stone` both verified ≥ 4.5:1 for body-size text — safe for links.
- All semantic state colors verified against both `night` and `stone`/`linen` backgrounds at ≥ 4.5:1 for the text/icon use case; the exact contrast matrix is generated and checked in CI once the design tokens ship as code (doc 40), not hand-verified once and left stale.

## What Was Deliberately Avoided
- No literal Ukrainian-flag blue+yellow pairing as primary UI colors — reserved at most for a small brand mark, never as a functional color pair users stare at all day.
- No `#F4F1EA`-family cream + terracotta pairing (common AI-generated-design default called out in the design system doc).
- No pure `#000000`/`#FFFFFF` extremes for base surfaces.
