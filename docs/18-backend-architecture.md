# 18 — Backend Architecture

## Stack
NestJS (TypeScript), PostgreSQL (primary datastore), Redis (cache, pub/sub, rate-limiting, session/presence), Elasticsearch (search), WebSocket gateway (NestJS's built-in Gateway over `socket.io` or raw `ws` — decision below), REST for most CRUD, GraphQL for the feed/aggregation-heavy read paths where clients need to shape queries flexibly (profile + posts + counts in one round trip).

## Why REST + GraphQL, Not One or the Other
Pure REST would mean either over-fetching (returning full post objects with nested author/comments everywhere) or a proliferation of narrow endpoints for every screen's exact data shape. Pure GraphQL for *everything* adds unnecessary complexity to simple, well-understood CRUD (auth, settings, report submission) where a fixed REST contract is easier to secure, cache, and reason about. Split:
- REST: auth, profile CRUD, settings, moderation/report actions, admin panel — anywhere the operation is a specific, well-defined command.
- GraphQL: feed queries, search result aggregation, chat list with last-message previews — anywhere the client benefits from shaping a read query across multiple related entities.

## Service Boundaries (modular monolith → extractable services)
Start as a modular monolith (single NestJS deployable, strict internal module boundaries) rather than microservices from day one — the team and traffic don't justify microservice operational overhead yet, and NestJS's module system lets each domain module be extracted into its own service later without a rewrite, only a deployment change, *if* internal boundaries are kept clean now.

Modules: `auth`, `users` (profile/graph), `posts` (posts/comments/engagement), `stories`, `chat` (messaging + E2E session metadata, never plaintext), `calls` (Phase 3 — WebRTC signaling only, media stays P2P/SFU, not through this service), `communities`, `feed`, `search`, `notifications`, `moderation`, `admin`.

First candidates for extraction into standalone services once scale demands it: `chat` (WebSocket load profile differs fundamentally from REST/GraphQL modules) and `feed`/`search` (read-heavy, benefit from independent scaling and caching strategy).

## Real-Time Layer
WebSocket gateway handles: message delivery, typing indicators, read receipts, presence (online/last-seen, respecting privacy settings), live notification push (Phase 3 NOTIF-2). Horizontal scaling via Redis pub/sub as the backplane (doc 05 NFR-SCALE-3) — a message published on one node's WebSocket connection is broadcast through Redis so recipients connected to other nodes still receive it.

`socket.io` chosen over raw `ws` for its built-in reconnection/room semantics (useful for chat "rooms" per conversation) — the added payload overhead is an acceptable tradeoff against reimplementing reconnection logic.

## Data Flow: Write Path Example (send message)
1. Client sends encrypted payload over WebSocket (or REST fallback if WS unavailable).
2. Gateway validates session/auth, persists encrypted blob + metadata to Postgres (never decrypts — server has no plaintext access, per doc 31).
3. Redis pub/sub broadcasts to recipient's connected node(s).
4. If recipient is offline: push notification triggered (doc 25) with minimal metadata (sender name, not message content, since content is encrypted and shouldn't be inferable from a push payload anyway).

## Background Jobs
BullMQ (Redis-backed) for: video transcoding trigger (doc 30), push notification dispatch, digest/summary jobs (future recommendation engine batch scoring, Phase 3), moderation queue population from spam-detection heuristics. Kept out of the request/response path so API latency (NFR-PERF-3) isn't coupled to job processing time.

## Environments
`local` (Docker Compose, doc 34) → `staging` → `production`, each with isolated databases; feature flags (a lightweight in-house table-driven flag system in Phase 1, revisit a dedicated flag service if complexity grows) gate incomplete features rather than long-lived feature branches, supporting the "no unfinished code merged to main" rule from the project brief.

## API Versioning
URL-prefixed versioning for REST (`/v1/...`), schema evolution via additive-only changes plus deprecation headers before breaking changes — mobile clients can't be forced to update instantly, so the backend must tolerate older client versions for a defined support window (policy set in doc 41, Release Strategy).
