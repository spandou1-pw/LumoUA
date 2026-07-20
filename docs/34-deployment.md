# 34 — Deployment

## Environments
`local` → `staging` → `production`, fully isolated (separate databases, object storage buckets/prefixes, Redis instances, Elasticsearch clusters/indices) — no shared state between environments, including no production data copied into staging without anonymization (ties to doc 49 legal/privacy review).

## Containerization
Every service (NestJS backend, web app build output served via a static/edge host, background job workers) runs as a Docker container. Multi-stage Dockerfiles (build stage with full toolchain → slim runtime stage) to keep production images minimal — smaller attack surface (doc 31) and faster deploys.

## Local Development
Docker Compose stack: Postgres, Redis, Elasticsearch, and the NestJS backend (with hot-reload volume mount) — a new engineer should be able to `docker compose up` and have a working local backend without manually installing/configuring four separate services. Mobile/web apps run natively (Expo dev server / Vite dev server) against this local backend, not containerized themselves in local dev (no benefit, adds friction to the fast-iteration loop mobile/web development needs).

## Production Orchestration
Kubernetes, per the brief's stated infrastructure choice. Structure:
- Deployments for the backend API (horizontally scaled, per doc 18's stateless-service design).
- Separate Deployment for WebSocket gateway pods if/when doc 18's chat-service extraction happens (Phase 2+) — until then, part of the main backend Deployment with sticky-session-aware load balancing (Redis pub/sub backplane, doc 18, means strict session affinity isn't required for correctness, only helpful for connection stability).
- Separate Deployment for BullMQ workers (background jobs, doc 18/25/30) — scaled independently from the API tier since job processing load doesn't correlate 1:1 with API request load.
- StatefulSet or managed external services for Postgres/Redis/Elasticsearch — **managed cloud offerings preferred over self-hosting stateful services in Kubernetes** for a team this size (e.g. managed Postgres, managed Redis) — self-hosting stateful data services adds significant operational burden that isn't a good use of a small team's time relative to buying that reliability from a provider; only revisit if managed-service cost becomes prohibitive at real scale.

## Deployment Strategy
Rolling deployments for the API tier (zero-downtime, Kubernetes-native), with a readiness-probe gate ensuring new pods pass health checks before old pods are terminated. Database migrations run as a separate step **before** the new application version's pods roll out (migration job as a Kubernetes Job, gating the deployment pipeline), and migrations must be backward-compatible with the previous app version for the duration of a rolling deploy (standard expand/contract migration pattern — add new columns/tables first, deploy code that can use them, only remove old columns in a later, separate deploy) so there's no window where old pods break against a migrated schema.

## Ingress & Edge
Cloudflare in front of everything (per the brief's stated CDN choice) — handles TLS termination, DDoS mitigation, static asset/image caching (doc 30), and routes to the Kubernetes ingress for API traffic.

## Rollback
Every deployment is tagged/versioned (container image tag = git commit SHA, never `latest` in production) so a rollback is a redeploy of the previous known-good tag, not a manual rebuild — this must be a fast, well-rehearsed path (target: rollback executable within minutes), specified further in doc 41 (Release Strategy).
