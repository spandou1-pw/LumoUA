# ADMIN_GUIDE.md — Administrator Documentation

Every admin capability in Єдина lives behind `RolesGuard` (`MODERATOR` or `ADMIN`, per doc 24's role split — moderators triage and view, only admins change platform-level standing or configuration). Nothing here is a separate admin app; all of it is real API endpoints under `/admin/*`, documented live in Swagger (`/api/docs`, filter by the "Admin —" tag prefix). This guide is the map across all of them — built incrementally from Stage 6 through Stage 16 — since no single document previously tied them together.

## Users & Content
- **Users** (`/admin/users`) — search, view detail, suspend/ban/reactivate (admin-only for status changes; moderators can view).
- **Posts/Comments moderation** — no dedicated list endpoint; content is removed via the Reports queue below (`/admin/moderation/reports/:id/remove-content`), which also notifies the author with the specific violated reason.
- **Communities** (`/admin/communities`) — platform-wide list, deactivate (distinct from a community's own internal owner/moderator roles, which are unaffected by platform admin actions elsewhere).

## Reports & Moderation (doc 32, Stage 13 — the centerpiece of the whole admin surface)
- `GET /admin/moderation/reports` — severity-prioritized open queue (self-harm/illegal-content always surface first, regardless of volume).
- `GET /admin/moderation/reports/grouped` — same reports, aggregated by target so duplicates don't clutter the queue.
- `PATCH /admin/moderation/reports/:id/resolve` — dismiss or mark actioned, without touching the content.
- `PATCH /admin/moderation/reports/:id/remove-content` — resolve AND remove, author notified with the specific reason.
- **Important**: there is no message-content moderation. Messages are E2E encrypted; a report against a message can only ever be resolved at the account level (suspend the sender), never by removing message content the server never had.
- `GET /admin/safety-filters` — the real-time keyword/regex filter list (Stage 14) — entirely admin-managed, nothing hardcoded in source.

## Financial
- **Payments** (`/admin/payments`) — purchase history, manual refunds, revenue analytics, premium conversion funnel.
- **Wallet/Coins** (`/admin/wallet`) — lock/unlock a wallet, manual balance adjustments (always actor+reason, audit-logged), fraud-flagged transfer review, transfer analytics.
- **Gifts** (`/admin/gifts`) — catalog/category CRUD (rarity, limited supply, seasonal windows), hide/unhide a gift's public visibility, analytics.

## Platform Configuration
- **Feature Flags** (`/admin/flags`) — create/update, including percentage-rollout (deterministic per-user, doc 42).
- **Configuration** (`/admin/configuration`) — generic key-value platform settings (JSONB values), audit-logged on every change.
- **Missions/Experiments** (`/admin/missions`, `/admin/experiments`) — Daily/Weekly/Seasonal mission definitions; A/B experiment creation and per-variant results (exposure/conversion counts and rates — no fabricated significance testing).

## Communication
- **Announcements** (`/admin/announcements`) — broadcast a push notification to every active user, dispatched via a background job.
- **Campaigns** (`/admin/campaigns`) — segmented push/email (targeting real predicates: `inactive_7d`, `non_premium`, etc., evaluated at send time, never a stale precomputed list).

## Oversight & Operations
- **Dashboard** (`/admin/dashboard/overview`) — cross-domain snapshot: users, revenue, subscriptions, gift volume, open report count. Composes existing per-domain analytics services; no duplicated logic.
- **Audit Log** (`/admin/audit-log`) — browse every admin action ever taken (actor, action, target, metadata), filterable. This has existed as a write-only table since Stage 4; this is the first read surface over it.
- **System Health** (`/admin/system-health`) — live Postgres/Redis connectivity checks (real round trips, not a static "ok").
- **Security Audit** (`/admin/security-audit`) — runtime configuration audit (default secrets, CORS wildcard, etc.) — run this after every deploy to a new environment.
- **Security** (`/admin/security/:userId/force-logout`) — emergency account containment, revokes every active session.
- **Retention/Funnels/Telemetry** (`/admin/retention`, `/admin/funnels`, `/admin/telemetry`) — cohort retention, custom funnel computation, crash/performance percentiles.

## Recommended first actions in any new environment
1. `GET /admin/security-audit` — confirm no default secrets, CORS is restricted.
2. `GET /admin/system-health` — confirm real DB/Redis connectivity.
3. Populate `/admin/safety-filters` with real moderation terms (ships empty by design — see AI.md).
4. Create the `founder` achievement via `/admin/profile-customization/achievements` if running the Founder Program (Stage 16).
