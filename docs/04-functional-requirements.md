# 04 — Functional Requirements

Codename: **Kolo**. Scope reflects the Phase 1–4 plan from doc 03. Each requirement is tagged with its phase.

## 4.1 Authentication (`AUTH`)
- AUTH-1 [P1] Register/login via email + password (verified by email code).
- AUTH-2 [P1] OAuth login via Google.
- AUTH-3 [P1] OAuth login via Apple (required for iOS App Store compliance if any 3rd-party login exists).
- AUTH-4 [P1] JWT access token + refresh token rotation.
- AUTH-5 [P4] Two-factor authentication (TOTP).
- AUTH-6 [P4] Passkeys (WebAuthn).
- AUTH-7 [P3] Device management: list active sessions, remote logout.

## 4.2 Profile (`PROF`)
- PROF-1 [P1] Avatar, cover image, display name, username, bio.
- PROF-2 [P1] Privacy settings: public / private account; who can message me; who can see my posts.
- PROF-3 [P2] Verified badge (manual admin grant in v1, no automated verification pipeline yet).

## 4.3 Social Graph (`GRAPH`)
- GRAPH-1 [P1] Follow / unfollow (asymmetric, Instagram-style).
- GRAPH-2 [P1] Friend request / accept (symmetric, for private-account contexts).
- GRAPH-3 [P1] Block (hides content both ways, prevents messaging).
- GRAPH-4 [P1] Mute (hides content one way, does not notify the muted user).

## 4.4 Posts & Engagement (`POST`)
- POST-1 [P1] Create text post (max length TBD in doc 22 API spec).
- POST-2 [P1] Create photo post, up to N images as carousel.
- POST-3 [P2] Create video post (requires transcoding pipeline — doc 30 Storage Architecture).
- POST-4 [P1] Comment on post (single-level threads in P1; nested replies P2).
- POST-5 [P1] Like post/comment.
- POST-6 [P2] Reactions beyond like (emoji set TBD).
- POST-7 [P1] Bookmark post (private to user).
- POST-8 [P2] Repost, with optional quote text.
- POST-9 [P1] Delete own post/comment; edit own post within a time window (TBD).

## 4.5 Stories (`STORY`) — Phase 2
- STORY-1 Photo/video story, 24h expiry by default.
- STORY-2 Story archive (opt-in persistence beyond 24h, visible only to owner).
- STORY-3 Close Friends list — restrict story visibility to a sublist.

## 4.6 Messenger (`MSG`)
- MSG-1 [P1] 1:1 chat, E2E encrypted (Signal Protocol, per doc 02).
- MSG-2 [P1] Read status, typing indicator.
- MSG-3 [P2] Group chat (E2E encrypted; ratchet strategy per group size — see doc 26).
- MSG-4 [P2] Channels (broadcast, one-to-many, not E2E — public content).
- MSG-5 [P2] Voice messages.
- MSG-6 [P2] File/image/video sharing in chat.
- MSG-7 [P2] Message edit, delete (for me / for everyone), reply, forward.
- MSG-8 [P2] Pinned messages, chat folders.
- MSG-9 [P2] In-chat search.

## 4.7 Calls (`CALL`) — Phase 3
- CALL-1 1:1 voice call via WebRTC.
- CALL-2 1:1 video call via WebRTC.
- CALL-3 Group calls (deferred beyond P3 unless demand justifies earlier work — flagged as a scope risk).

## 4.8 Notifications (`NOTIF`)
- NOTIF-1 [P1] Push notifications for messages, mentions, follows (basic).
- NOTIF-2 [P3] In-app "live" notification center with real-time updates via WebSocket.

## 4.9 Search (`SEARCH`)
- SEARCH-1 [P1] Search people, posts, hashtags (Elasticsearch-backed, basic relevance).
- SEARCH-2 [P2] Search communities, messages (in-chat).
- SEARCH-3 [P3] Ukrainian-morphology-aware search tuning (stemming/lemmatization tuned for Ukrainian, not just default analyzers).

## 4.10 Communities (`COMM`) — Phase 2
- COMM-1 Public and private communities.
- COMM-2 Moderator roles, community rules text.
- COMM-3 Events within communities (basic: title, time, RSVP).

## 4.11 Feeds & Recommendation (`FEED`)
- FEED-1 [P1] Following feed — reverse chronological.
- FEED-2 [P1] Global feed — reverse chronological, basic spam filtering only.
- FEED-3 [P3] Recommended feed — ML-based ranking.
- FEED-4 [P3] Trending feed — hashtag/post velocity based.

## 4.12 Moderation (`MOD`)
- MOD-1 [P1] User reporting (post, comment, profile, message).
- MOD-2 [P1] Admin moderation queue (manual review).
- MOD-3 [P2] Rule-based spam detection (rate limits, link/heuristic filters).
- MOD-4 [P3] AI-assisted content classification (flag-for-review, not auto-removal in v1 — human-in-the-loop by default).

## 4.13 Admin Panel (`ADMIN`)
- ADMIN-1 [P1] User management (search, view, suspend, ban).
- ADMIN-2 [P1] Reports queue.
- ADMIN-3 [P2] Platform statistics dashboard.
- ADMIN-4 [P2] Announcements (platform-wide banner/notification).

## Traceability
Every requirement ID above must be referenced in the corresponding milestone(s) in the eventual `MILESTONES.md` (doc 50), so implementation coverage of this spec is auditable.
