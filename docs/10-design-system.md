# 10 — Design System

## Design Brief Interpretation
Kolo needs a visual identity that reads as *Ukrainian without being a flag graphic*, and *premium/minimal without being another cream-background-serif AI-generated template*. The brief for this document is: ground the identity in something real from the subject's world — Ukrainian visual culture — rather than decorate a generic template with a blue-and-yellow accent.

## Design Plan

### Color (full rationale + values in doc 12)
- Two named palettes, not just light/dark inversions of one accent: a **night** palette (deep indigo, not pure black) and a **stone** palette (warm grey, not cream) as the two base surfaces.
- One primary accent: **wheat gold** — pulls from Ukraine's wheat fields (a real, specific visual reference, not the flag), used sparingly for primary actions and the signature ring element.
- One secondary accent: **chicory blue** — a muted, slightly desaturated blue (cornflowers/chicory growing at field edges, not sky-and-flag blue), used for links, selection states, and secondary emphasis.
- Explicitly avoided: literal flag blue+yellow as a color pair (too on-the-nose for daily-use UI, fatigues fast), and the near-cream `#F4F1EA` + terracotta pairing common in AI-generated design defaults.

### Type
- Display face: **Fixel Display** — a variable typeface from a Ukrainian type foundry with strong native Cyrillic design (not a Latin face with Cyrillic bolted on). Used with restraint: headlines, the wordmark, empty-state headers.
- Body face: **Golos Text** — a Ukrainian-made humanist sans, built for UI legibility at small sizes in both Cyrillic and Latin. This is the workhorse face for 95% of on-screen text.
- Utility/mono face: **JetBrains Mono** — for timestamps, code-like data (usernames, IDs), and the admin panel's data-dense views.
- Full scale and pairing rules in doc 13.

### Layout Concept
- Mobile: single-column, content-first, generous vertical rhythm — feed and chat are both "stream" surfaces, so they share a base spacing/grid unit (8pt) even though their content types differ.
- Web: two/three-pane depending on surface (Messages = list + thread; Feed = single centered column with a persistent left nav, not a three-column Twitter-style layout, since Kolo's feed is intentionally calmer/less algorithmically dense than that pattern implies).
- ASCII concept, chat surface (web):
  ```
  ┌────────┬───────────────┬──────────────────┐
  │  nav   │  chat list    │   active thread   │
  │ (icons)│  (search+list)│  (messages+input) │
  └────────┴───────────────┴──────────────────┘
  ```
- ASCII concept, feed surface (mobile):
  ```
  ┌─────────────────────────┐
  │  Following | Global      │
  ├─────────────────────────┤
  │  ◯ story ◯ story ◯ ...   │  ← Коло ring motif
  ├─────────────────────────┤
  │  [ post card ]           │
  │  [ post card ]           │
  └─────────────────────────┘
  ```

### Signature Element: "Коло" (the ring)
The product name means *circle*. Rather than use that as a literal logo shape only, the ring becomes a **functional motif** reused across the product: the avatar ring around story previews (color/fill state communicates unseen vs. seen, matching a pattern users already read fluently from Instagram — deliberately not reinvented, since the ring's *job* here is communication, not decoration), the circular progress indicator for uploads/loading, and a subtle ring-based transition when opening a chat or story from its avatar (the avatar ring expands into the full-screen surface, doc 16). This is the one place the product spends its "boldness" — everything else in the system stays quiet and disciplined around it.

## Token System Summary
Full values live in docs 12–14. Structure:
- `color.surface.*`, `color.text.*`, `color.accent.*`, `color.state.*` (success/error/warning, kept semantically named, not tied to raw hex in component code)
- `type.display.*`, `type.body.*`, `type.utility.*` (each with size/weight/line-height sets)
- `space.*` — 8pt base scale: 4, 8, 12, 16, 24, 32, 48, 64
- `radius.*` — small (8px, inputs/chips), medium (16px, cards), full (avatars/rings/pills) — deliberately not zero-radius/hairline-rule "broadsheet" style, since that direction doesn't fit a warm, native-feeling mobile-first product
- `motion.*` — durations and easing curves, doc 16

## Governance
Every new UI component must be built from these tokens, not raw hex/px values (enforced via lint rule in doc 40, Coding Standards). Any exception requires a note in the component's doc entry (doc 15) explaining why.
