# 09 — Information Architecture

## Top-Level Navigation (Mobile — iOS/Android, Phase 1)
Bottom tab bar, 5 tabs:
1. **Feed** (Following / Global toggle at top — Global is Phase 1 basic, Recommended tab added Phase 3)
2. **Search** (people, posts, hashtags — communities/messages added Phase 2)
3. **Compose** (center action, modal — not a persistent tab content area)
4. **Messages** (chat list; folders added Phase 2)
5. **Profile** (own profile + settings entry point)

Rationale: Compose-as-center-action (not a literal tab you "land on") avoids the common IA mistake of making post-creation feel like a destination rather than an action — consistent with doc 01's "one coherent identity" pillar, since Messages and Feed both need to feel equally primary, not messaging-as-afterthought or feed-as-afterthought.

## Web/Desktop Navigation (Phase 1, PWA)
Left sidebar (persistent, not a hamburger menu, given desktop screen real estate): Feed, Search, Messages, Profile, Compose (button, not nested). Two-pane layout for Messages (list + active chat) matches user expectations set by Telegram Web/WhatsApp Web — a case where matching an established pattern reduces cognitive load rather than being unnecessary imitation.

## Profile Structure
- Header: avatar, cover, display name, username, bio, follower/following counts (tap-through to lists), Follow/Message/More actions.
- Content tabs: Posts grid, Bookmarks (private, own profile only), Tagged (Phase 2).
- Settings entry point (own profile only): Account, Privacy, Notifications, Language, Blocked/Muted lists, Data & Security (2FA/passkeys/device management once Phase 4 ships), Help.

## Chat List Structure
- Pinned chats (top).
- Unread-first or chronological — `[OPEN QUESTION]`: default sort needs real user testing (doc 06); chronological is the safer Phase 1 default since it's the most predictable/least surprising.
- Folders (Phase 2): All, Unread, custom user-defined folders — mirrors a pattern users already understand from Telegram, adopted deliberately per the "match strength, exploit weakness" framing in doc 06, not copied wholesale (no channel/chat structural split — channels live inside the same unified chat list, consistent with the "no Telegram channel/chat split" pillar from doc 01).

## Post Detail Structure
Post content → engagement bar (like/comment/bookmark/repost — reactions replace simple like in Phase 2) → comment thread (single-level Phase 1, nested Phase 2).

## Community Structure (Phase 2 — included here for IA completeness)
Community header (name, cover, member count, public/private badge) → tabs: Posts, Members, Events, About/Rules. Moderator actions surfaced via overflow menu, not a separate permanent UI area, to keep the structure identical for members and moderators (reduces implementation and design surface).

## Search Structure
Single search bar with result-type tabs (People / Posts / Hashtags in Phase 1; + Communities / Messages in Phase 2), not separate search entry points per type — one mental model for "search," consistent with doc 01's speed/simplicity pillar.

## Notes on Deferred IA Decisions
- Recommended/Trending feed tab placement (Phase 3) is deferred rather than reserved now, since adding a tab later is low-cost but reserving dead space for two phases is a real UX cost.
- Admin panel IA is out of scope for this document — it is a separate web-only surface for internal/admin roles and will get its own IA pass alongside doc 33 (Admin Panel details) since its audience and information density needs differ fundamentally from the consumer app.
