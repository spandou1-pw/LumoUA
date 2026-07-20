# 14 — Iconography

## Style Direction
Custom icon set, not a stock library (Feather/Lucide/Material) used unmodified — a stock set would undercut the "own identity" requirement from the brief. Approach: commission/design a custom set that shares Fixel Display's geometric character (consistent stroke terminals, similar corner radius logic to the `radius.small` token) so icons and type feel drawn by the same hand.

- Stroke-based (not filled) for the default/inactive state, filled for active/selected state (e.g. inactive Feed tab icon = outline house/stream glyph, active = filled) — a standard, well-understood convention, kept rather than reinvented, since icon *legibility* is not the place to spend the system's "boldness" (that's the ring motif, per doc 10).
- Stroke weight: 1.75px at 24px base size, scaling proportionally at other sizes (16px, 20px, 32px grid).
- Corner style: slightly rounded terminals (not sharp, not fully round) — echoes `radius.small` rather than the full-round `radius.full` used for avatars/pills, so icons don't visually compete with the ring motif's circular language.

## Core Icon Inventory (Phase 1 minimum set)
Navigation: feed/home, search, compose (plus), messages, profile.
Actions: like (heart), comment (speech bubble), bookmark, repost/share, more (overflow dots), back, close, send.
Chat: attach, camera, voice-message (mic), checkmark (sent), double-checkmark (delivered/read — color-shifts to `chicory` when read, not a new glyph), typing-indicator (animated dots, not a static icon — see doc 16).
Status/system: lock (E2E indicator in chat header), bell (notifications), settings (gear), block, mute, report (flag).

## Usage Rules
- Icons never carry meaning through color alone (accessibility floor, doc 47) — always paired with either a label or an unambiguous shape difference (e.g. filled vs outline), so color-blind users aren't relying on `success` vs `error` hue alone.
- The E2E lock icon in chat headers is a **trust-critical** icon (ties to Persona 3, doc 07) — it must be pixel-identical and consistently placed across iOS/Android/Web, and is one of the few icons that should get a dedicated visual regression test (doc 38), since inconsistency here directly undermines the "legible encryption" product goal from doc 06.

## Delivery Format
SVG source, exported to icon font/sprite per platform build tooling needs (decided in doc 17/19 architecture docs) — SVG is the source of truth, not a proprietary icon-font-only workflow, so the set stays editable and accessible (screen readers need real semantics, not font-glyph unicode hacks).
