# API_DOCUMENTATION.md

## The real API contract is Swagger, not this file

Every controller in this codebase carries `@ApiTags`/`@ApiOperation`/`@ApiBearerAuth` decorators (doc 21, enforced since Stage 5). Running the server and visiting `/api/docs` gives the actual, current, request/response-accurate contract — generated directly from the same decorators the code runs on, so it cannot drift the way a hand-maintained API reference document would. A machine-readable OpenAPI JSON is also served at `/api/docs-json` for generating client SDKs.

**This file intentionally does not re-list every endpoint** — duplicating Swagger's content here would immediately go stale the first time a controller changes and this file doesn't. What follows is the orientation Swagger itself doesn't give you.

## Conventions that apply across every endpoint

- **Auth**: `Authorization: Bearer <accessToken>` on every endpoint except those explicitly marked `@Public()` (login, register, refresh, webhooks). Access tokens are short-lived; refresh via `POST /auth/refresh` using the rotation flow described in doc 23/SECURITY.md.
- **Errors**: doc 22's envelope — `{ "error": { "code": "SOME_CODE", "message": "..." } }`. Always branch on `code`, never parse `message` (message text isn't a stable contract; `code` is).
- **Pagination**: every list endpoint is cursor-based — `?cursor=<opaque>&limit=<n>`, response includes `nextCursor: string | null`. There is no offset/page-number pagination anywhere in this API.
- **Rate limits**: tiered (doc 31) — auth endpoints are the tightest, general endpoints the most permissive. A 429 includes a `Retry-After` header.
- **Idempotency**: financial mutations (gift sends, transfers, purchase fulfillment) are idempotent at the database level (unique constraints on `platform_transaction_id`, etc.) — safe to retry on a network timeout.

## Where to find the design rationale behind an endpoint

Swagger tells you the shape of a request/response. It doesn't tell you *why* a field exists or what invariant an endpoint enforces. For that, the per-domain `.md` files at the repo root are the actual documentation: `PAYMENTS.md` for wallet/payments semantics, `GIFTS.md` for the gift economy's non-redemption boundary, `AI.md` for what's real vs. stubbed in AI-adjacent endpoints, and so on — cross-referenced from `DEVELOPER.md`.

## Postman / client SDK generation

`GET /api/docs-json` is a standard OpenAPI 3.0 document — importable directly into Postman/Insomnia, or run through `openapi-generator`/`orval` to generate a typed client for any language. This wasn't pre-generated and checked into the repo (it would go stale between generations); generate it fresh from a running instance whenever a client SDK is needed.
