# 02 — Product Requirements

Status: DRAFT — pending decisions flagged inline as `[DECISION NEEDED]`

## Scope of v1 (MVP) vs Later
The original brief lists an enormous surface area (auth, profiles, posts, stories, full messenger, calls, communities, feeds, recommendation engine, AI moderation, admin panel). Shipping all of it simultaneously is not realistic as a v1. Proposed phased scope:

### Phase 1 — MVP (messaging + identity + basic feed)
- Auth: email + Google + Apple (2FA and passkeys deferred to Phase 2)
- Profile: avatar, cover, bio, privacy settings
- Follow / friend / block / mute graph
- Posts: text, photo, basic carousel
- Comments, likes, bookmarks
- Private 1:1 chat with E2E encryption, read status, typing indicator
- Push notifications (basic)
- Global + Following feed (no recommendation ML yet — reverse-chron + simple ranking)
- Basic search: people, posts, hashtags
- Basic admin panel: user management, reports queue

### Phase 2 — Messenger depth + Communities
- Group chats, channels, voice messages, file/image/video sharing, message edit/delete/reply/forward, pinned messages, folders
- Communities (public/private, moderators, rules)
- Stories (photo/video, archive, close friends)
- Reposts, reactions
- Reporting + human moderation tools

### Phase 3 — Calls, Recommendation Engine, AI Moderation
- WebRTC voice/video calls
- Personalized recommendation feed
- AI content moderation / spam detection
- Trending feed, hashtag discovery
- Device management, audit logs, advanced security

### Phase 4 — Scale & Polish
- Desktop PWA parity
- Advanced analytics, crash reporting pipeline
- Performance tuning to 120fps target, full accessibility audit
- Passkeys, 2FA rollout

`[DECISION NEEDED]`: Confirm this phasing, or re-prioritize (e.g. some teams building a Telegram-alternative would prioritize Messenger depth over Feed in Phase 1).

## Functional Requirements Summary (detailed spec lives in doc 04)
| Domain | Phase | Notes |
|---|---|---|
| Auth (email/Google/Apple) | 1 | 2FA + passkeys → Phase 4 |
| Profile & privacy | 1 | |
| Social graph (follow/friend/block/mute) | 1 | |
| Posts (text/photo/carousel) | 1 | Video posts → Phase 2 |
| Comments/likes/bookmarks | 1 | Reactions (beyond like) → Phase 2 |
| 1:1 encrypted chat | 1 | |
| Group chat/channels | 2 | |
| Voice/video messages, file sharing | 2 | |
| Stories | 2 | |
| Communities | 2 | |
| Calls (WebRTC) | 3 | |
| Recommendation engine | 3 | |
| AI moderation | 3 | |
| Admin panel (full) | 2–3 | Basic version in Phase 1 |

## Non-Functional Requirements (summary — full detail in doc 05)
- Ukrainian (default) + English localization; no Russian.
- Target: usable on mid-range Android (e.g. 3-4GB RAM devices common in Ukraine) and on unreliable mobile networks.
- E2E encryption for private messages (protocol choice TBD — see doc 23/26).
- Data residency: `[DECISION NEEDED]` — EU hosting is the realistic default given the infra list (AWS/Cloudflare); confirm if Ukraine-specific hosting/legal requirements apply.

## Decisions (defaults adopted — no response received, proceeding per project owner's instruction)
Since no answers were provided, the following defaults are adopted so work can continue. These are reversible — flag any of them for change at any time and downstream docs will be updated.

1. **Product name & brand**: working codename `Kolo` ("Коло" — Ukrainian for "circle"), placeholder pending real branding work (doc 10 Design System).
2. **Monetization model**: freemium — free core product, optional creator/community subscriptions (Phase 3+). No ad-based targeting in v1, consistent with doc 01 non-goals.
3. **Data residency / legal jurisdiction**: EU hosting (AWS/Cloudflare EU regions) as the pragmatic default, revisited in doc 49 (Legal) once real legal counsel is available — this is not a substitute for legal advice.
4. **Phased scope**: the Phase 1–4 breakdown above is adopted as-is.
5. **E2E encryption protocol**: Signal Protocol (Double Ratchet + X3DH) for 1:1 and small-group chat — the most battle-tested open option, matching the "native feeling" and security bar set in the brief. Revisit MLS for large groups/channels in Phase 2 if group size demands it.
