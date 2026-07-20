# 22 — API Specification

Scope: Phase 1 surface. Full OpenAPI/GraphQL SDL will be generated from actual NestJS decorators/resolvers once implementation begins (this doc is the human-readable contract implementation is built against, not a hand-maintained duplicate that drifts from code — CI will fail a build if the generated schema and this doc's described shape diverge beyond an agreed tolerance, detailed in doc 36).

## Conventions
- Base URL: `https://api.kolo.app/v1` (placeholder domain).
- Auth: `Authorization: Bearer <access_token>` (JWT, doc 23).
- Errors: consistent envelope `{ "error": { "code": "STRING_CODE", "message": "human-readable", "details": {...} } }`, HTTP status codes used correctly (400 validation, 401 unauthenticated, 403 unauthorized, 404 not found, 409 conflict, 429 rate-limited).
- Pagination: cursor-based (`?cursor=<opaque>&limit=<n>`) for all list endpoints — not offset-based, since feed/chat lists are frequently-mutating and offset pagination would produce duplicate/skipped items under concurrent writes.

## REST Endpoints (Phase 1)

### Auth
- `POST /auth/register` — email + password → sends verification code
- `POST /auth/verify-email` — code → activates account
- `POST /auth/login` — email + password → access + refresh token
- `POST /auth/oauth/:provider` — Google/Apple token exchange → access + refresh token
- `POST /auth/refresh` — refresh token → new access token
- `POST /auth/logout` — invalidates current refresh token

### Users / Profile
- `GET /users/me` — current user profile
- `PATCH /users/me` — update profile fields (PROF-1)
- `GET /users/:username` — public profile view (respects blocking/privacy)
- `POST /users/:id/follow` / `DELETE /users/:id/follow`
- `POST /users/:id/block` / `DELETE /users/:id/block`
- `POST /users/:id/mute` / `DELETE /users/:id/mute`
- `POST /friend-requests` / `PATCH /friend-requests/:id` (accept/decline) / `GET /friend-requests`

### Posts
- `POST /posts` — create (body + media references, POST-1/2)
- `GET /posts/:id`
- `PATCH /posts/:id` / `DELETE /posts/:id` (author only)
- `POST /posts/:id/comments` / `GET /posts/:id/comments`
- `POST /posts/:id/like` / `DELETE /posts/:id/like`
- `POST /posts/:id/bookmark` / `DELETE /posts/:id/bookmark`
- `POST /media/upload-url` — returns a pre-signed R2/S3 upload URL (doc 30), client uploads directly, then references the returned key when creating the post

### Chat
- `GET /conversations` — list, includes last message metadata (not plaintext) for preview
- `POST /conversations` — start a direct conversation
- `GET /conversations/:id/messages` — cursor-paginated
- `POST /devices/keys` — publish device's Signal Protocol prekey bundle (doc 26)
- `GET /devices/:userId/keys` — fetch a user's prekey bundle to initiate a session
- (Actual message send/receive happens over WebSocket, not REST — REST here covers session bootstrap and history only)

### Moderation
- `POST /reports` — file a report (MOD-1)

### Admin (requires admin role, doc 24)
- `GET /admin/reports` — queue
- `PATCH /admin/reports/:id` — resolve (dismiss/warn/suspend/ban)
- `GET /admin/users` / `PATCH /admin/users/:id/status`

## GraphQL (Phase 1 read-heavy aggregation)
- `feed(type: FOLLOWING | GLOBAL, cursor: String): FeedConnection` — returns posts with author, media, and viewer-specific engagement state (liked/bookmarked) in one query, avoiding the N+1 REST round-trips a feed screen would otherwise need.
- `search(query: String!, types: [SearchType!]): SearchResults` — people/posts/hashtags in one call (doc 09 IA's unified search).
- `conversationsList: [ConversationSummary!]` — chat list with last-message preview + unread counts, similarly aggregation-shaped.

## WebSocket Events (doc 18/26)
- Client → Server: `message:send`, `typing:start`/`typing:stop`, `message:read`
- Server → Client: `message:new`, `message:delivered`, `message:read`, `typing:update`, `presence:update`

## Rate Limits (default, tunable per endpoint — doc 31)
- Auth endpoints: 10 requests/hour/IP for register, 20/hour/IP for login attempts (credential-stuffing resistance, NFR-SEC-3).
- General authenticated endpoints: 300 requests/minute/user, enforced via Redis token-bucket.
