# Єдина — Backend (edina.ua)

NestJS modular monolith implementing the modules requested for Stage 4:
Database & Migrations, Authentication, Authorization, Users, Roles, Files
(Images/Videos), Notifications, Messages, Communities — built against the
architecture in docs 18/20/22–26/30/31.

## Quick start

```bash
cp .env.example .env          # fill in real values for anything beyond local dev
docker compose up -d          # Postgres + Redis + Elasticsearch
npm install
npm run migration:run         # runs migrations 1700000000001 → 1700000000007
npm run start:dev
curl localhost:3000/health
```

## Module map (doc 39 folder structure → doc reference)

| Module | Path | Docs |
|---|---|---|
| Auth | `src/modules/auth` | doc 23 — argon2id password hashing, JWT access + rotating refresh tokens with reuse detection, OAuth account-link-not-merge safeguard |
| Users (incl. Roles' target + PolicyService) | `src/modules/users` | doc 24 — shared `PolicyService` is the single source of truth for relationship-dependent authorization (block/privacy/messaging checks), reused by Messages & Communities |
| Roles | `src/modules/roles` | doc 24 — admin-only platform role assignment, always audit-logged |
| Files | `src/modules/files` | doc 30 — pre-signed R2/S3 uploads, BullMQ-driven image/video processing pipeline, orphan cleanup, right-to-erasure deletion |
| Notifications | `src/modules/notifications` | doc 25 — event-driven dispatch, per-type preferences, Expo push wrapper, stale-token deactivation |
| Messages | `src/modules/messages` | doc 26 — Signal Protocol key brokering (server never sees private keys or plaintext), WebSocket gateway with Redis adapter for horizontal scaling, delete-for-everyone purges ciphertext |
| Communities | `src/modules/communities` | doc 04 COMM / doc 24 scoped community roles (distinct from platform roles) |
| Database/Migrations | `src/database/migrations` | doc 20 — hand-written SQL migrations, `synchronize: false` always (doc 34) |
| Common (guards/filters/interceptors) | `src/common` | doc 22 (error envelope), doc 24 (RolesGuard), doc 31 (redaction interceptor) |

## What's intentionally stubbed, not faked

Per the project's "no placeholder APIs, no fake data" rule, every stub below
is a real integration point clearly marked with `TODO` and a comment
explaining exactly what real implementation plugs in — not a fake response
pretending to be complete:

- **Google/Apple OAuth verification** (`auth.controller.ts`) — throws
  `NOT_IMPLEMENTED` rather than pretending to validate a token. Wire in
  `google-auth-library` / Apple JWKS verification before this ships.
- **Image resizing / blurhash** (`files/processors/image.processor.ts`) —
  orchestration is real (queue → fetch → variants → save), the actual
  `sharp`/blurhash calls are marked `TODO`.
- **Video transcoding** (`files/processors/video.processor.ts`) — provider
  choice (Cloudflare Stream vs self-hosted FFmpeg) is explicitly deferred
  per doc 30, orchestration shell is real.
- **Web Push** (`notifications/dispatchers/push.dispatcher.ts`) — Expo
  push (iOS/Android) is fully wired; Web Push (VAPID) is marked `TODO`.

## Not yet built (next milestones per doc 50)

Posts/Comments/Likes/Bookmarks/Feed, Search (Elasticsearch), Stories, admin
moderation queue endpoints, and the AuthN OAuth verification above — these
are the next milestones in sequence, not omissions from this batch's scope
(which was Database/Migrations/Auth/Authz/Users/Roles/Files/Notifications/Messages/Communities).
