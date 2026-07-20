# 15 — Components

Feature-specific, assembled components — built from doc 11 primitives + doc 12/13/14 tokens. Scope: Phase 1 components only (per doc 03 phasing); Phase 2+ components (Story viewer, Community header, Call UI) will be added to this doc when their phase begins, not speculatively designed now.

## Post Card
Structure: Avatar(sm) + display name + username + timestamp (`body.sm`, `text.secondary`) → post body (`body.lg`) → media (if present, respects original aspect ratio, `radius.medium`, max height capped to keep feed scannable) → engagement bar (like/comment/bookmark/repost icons + counts in `body.sm`).
States: own-post (adds overflow menu with edit/delete), liked (heart fills + `wheat` tint), optimistic-pending (slight opacity reduction while server confirms, per NFR-PERF-4).

## Chat Bubble
Structure: message text (`body.lg`) in a `radius.medium` bubble, sender's bubble right-aligned + `chicory`-tinted background, recipient's left-aligned + neutral elevation-1 surface. Timestamp + status glyphs (sent/delivered/read) in `body.sm`/`mono.sm` beneath the last bubble in a consecutive run, not on every bubble (reduces visual noise — consecutive messages from the same sender group with reduced vertical spacing).
E2E indicator: lock icon (doc 14) in the chat header, persistent, not just an onboarding tooltip that disappears — trust signals need to be always-available, not one-time.

## Chat List Item
Avatar(md, with ring if unseen story exists) + name + last-message preview (truncated, `body.md`, `text.secondary` if read / `text.primary` + medium weight if unread) + timestamp + unread badge.

## Profile Header
Cover image (elevation-2 surface as fallback if none set — never a jarring blank/broken-image state) + Avatar(xl) overlapping the cover + display name (`display.md`) + username (`mono.sm`, `text.secondary`) + bio (`body.md`) + follower/following counts (tappable, `label.md`) + primary action row (Follow/Message/Edit Profile depending on viewer context).

## Compose Sheet
Bottom sheet (mobile) / modal (web): textarea (auto-growing, `body.lg`) + media attach row + privacy-scope indicator (shows current default from PROF-2, tappable to override per-post) + Post button (`primary`, disabled until content present).

## Report Flow Sheet
Structured reason list (radio-style selection, not a dropdown — keeps all options visible, reduces cognitive load per doc 08 flow 5) + optional detail textarea + Submit button + confirmation state (checkmark + short interface-voice confirmation copy, no promised timeline).

## Empty States (Phase 1 instances)
- Empty Following feed (new user): headline + "Find people to follow" primary action → routes to Search.
- Empty chat list: headline + "Start a conversation" → routes to a contact/people picker.
- No search results: headline acknowledging the specific query text, not a generic "no results," + suggestion to check spelling/try a different term.

## Admin Reports Queue Row (basic, Phase 1)
Reported content preview (truncated) + report reason + reporter count (if multiple reports on same item, aggregate rather than list duplicates) + action buttons (Dismiss / Warn / Suspend / Ban) — full admin panel detail deferred to a dedicated pass alongside doc 33.
