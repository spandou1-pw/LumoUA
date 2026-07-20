# DEVELOPER.md — Getting Started

## Setup

```bash
cp .env.example .env              # fill in real values — see LAUNCH_READINESS.md for what's stubbed
docker compose up -d              # Postgres, Redis, Elasticsearch (unused until Search is built)
npm install
npm run migration:run             # runs all 17 migrations in order
npm run start:dev
curl localhost:3000/health
open http://localhost:3000/api/docs   # live Swagger UI
```

## Running tests

```bash
npm run test:unit          # 162 tests, no external dependencies, runs anywhere
npm run test:integration    # needs the docker-compose stack running (real Postgres/Redis)
```

## Testing registration locally (no email provider configured)

No email provider is wired (see `LAUNCH_READINESS.md`), so the email verification code has nowhere to send in a local dev environment. When `NODE_ENV !== 'production'`, `AuthService` logs the code to the **server console** instead — watch the terminal running `npm run start:dev` after calling `POST /auth/register`, you'll see:

```
[DEV ONLY] Email verification code for user <uuid>: 123456
```

This path is strictly gated behind the non-production check — it can never leak into a real deployment's logs. Once a real `EMAIL_PROVIDER_API_KEY` is configured, wire the actual send in `issueVerificationCode` and this console fallback becomes dead code you can remove.

## Architecture at a glance

NestJS modular monolith (doc 18) — one deployable, strict module boundaries, each domain owns its controllers/services/entities. Cross-module access goes through exported providers only (doc 39), never reaching into another module's repository directly.

```
src/
  common/           guards, decorators, filters, interceptors, pagination — shared across every module
  config/           TypeORM data source config
  database/         17 migrations, in order, hand-written SQL (never `synchronize: true`)
  health.controller.ts
  main.ts           bootstrap: CORS, ValidationPipe, Redis WebSocket adapter, Swagger, metrics interceptor
  app.module.ts     the full module registration — the fastest way to see everything that exists
  modules/
    auth/ users/ roles/                     — identity & authorization (Stage 4)
    files/ notifications/ messages/          — media, push, messaging (Stage 4)
    communities/                             — Stage 4, extended Stage 13 (platform-level oversight)
    posts/ comments/ reactions/ feed/        — Stage 5
    payments/ wallet/ subscriptions/         — Stage 6, extended Stage 9 (transfers/security)
    gifts/                                   — Stage 8
    premium/ profile-customization/          — Stage 7, extended Stage 10
    moderation/ feature-flags/ configuration/
    admin/ admin-dashboard/                  — Stage 13
    ai-platform/                             — Stage 14 (spam/fake-account detection, recommendations, moderation, translation)
    gdpr/ sessions/ bot-detection/ monitoring/ security-audit/  — Stage 15
    growth/ (referrals, founder, missions, ab-testing)
    analytics/ (retention, funnels, creator-dashboard, crash-performance)
    campaigns/                               — Stage 16
```

## Finding your way around

- **Every module's own status/design doc** is at the repo root (`PAYMENTS.md`, `GIFTS.md`, `COINS.md`, `PREMIUM.md`, `PROFILE.md`, `ADMIN.md`, `AI.md`, `SECURITY.md`, `GROWTH.md`, `API_PLATFORM.md`) — read the one for the area you're touching before changing it; each explains *why* things are built the way they are, not just what exists.
- **`LAUNCH_READINESS.md`** is the current, honest source of truth for what's real vs. stubbed vs. not built at all — check it before assuming a feature works end-to-end.
- **Swagger** (`/api/docs`) is generated from the same decorators the controllers carry — it cannot drift from the real contract the way a hand-written API doc could.

## Coding conventions actually enforced in this codebase

- `strict: true` TypeScript everywhere, no bare `any` (a few narrow, commented exceptions exist where TypeORM's JSONB typing fights strict mode — e.g. `configuration.service.ts`).
- Every entity has a doc-comment explaining *why* its shape is what it is, not just its fields — read those before adding a column.
- Cursor pagination on every list endpoint (`common/pagination/pagination.dto.ts`) — never offset pagination.
- One shared `PolicyService` (users module) for every relationship-dependent authorization check (blocked/privacy/messaging permission) — never reimplemented per-module.
- Domain events (`EventEmitter2`) for "notify me when X happens" relationships between modules; direct service injection only for "I need X's return value right now."
- External dependencies (payment providers, AI classifiers, email) are always real orchestration + a clearly-thrown `NOT_IMPLEMENTED` when unconfigured — never a fake success response.

## Adding a new module

1. Check `LAUNCH_READINESS.md` and the relevant `*.md` doc first — it may already be partially built or explicitly deferred for a reason.
2. Follow the existing module shape: `entities/`, `dto/`, `*.service.ts`, `*.controller.ts`, `*.module.ts`.
3. Add a migration (`src/database/migrations/`, sequential timestamp naming).
4. Wire the module into `app.module.ts`.
5. Add unit tests for any real business logic (pure functions and heuristics especially — see `test/unit/percentile.spec.ts` or `test/unit/variant-assignment.spec.ts` for the pattern).
6. Run `npm run test:unit` and `npx tsc --noEmit` before considering it done.
