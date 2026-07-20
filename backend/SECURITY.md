# SECURITY.md — Security & Scalability (Stage 15)

## What already existed vs. what's genuinely new

Same audit-before-building discipline as every prior stage:

| Requested item | Status before this stage | This stage |
|---|---|---|
| Rate Limiting | ✅ Fully built since Stage 4/5 (`ThrottlerModule`, tiered `RateLimit*` decorators) | Unchanged |
| Logging | ✅ Fully built since Stage 4 (`LoggingRedactionInterceptor`) | Unchanged |
| E2E Encryption | ✅ Server-side key brokering built since Stage 4 (doc 26) | Unchanged — see note below on client-side gap |
| Session Management | 🟡 Refresh-token rotation + reuse detection + "logout everywhere" existed | **Extended**: per-device listing/selective revocation (`SessionsService`) |
| Device Management | 🟡 `DeviceKey` (E2E) existed; no session-device visibility | **Built**: device metadata on `RefreshToken`, `GET /sessions` |
| GDPR Compliance | 🟡 Documented extensively (doc 49); **zero actual export/deletion endpoints existed** | **Built**: real `DataExportService` + `DataDeletionService` |
| Bot Detection | ❌ Not built | **Built**: honeypot + timing heuristics (real), CAPTCHA verification (stubbed, same pattern as every external provider) |
| DDoS Protection | 🟡 App-level rate limiting existed; no edge-level config | **Built**: real nginx `limit_req`/`limit_conn` config (infra-level, unverified in this sandbox) |
| Backup System | 🟡 Documented (doc 45); no actual script | **Built**: real `pg_dump` automation script + a unit-tested retention-policy module |
| Disaster Recovery | 🟡 Documented (doc 44); no tooling | Unchanged this stage — see "Explicitly not built" |
| Monitoring | 🟡 Documented (doc 37); `SystemHealthController` (Stage 13) did basic checks; **no actual metrics instrumentation existed** | **Built**: real `prom-client` registry, RED-method HTTP metrics, `/metrics` endpoint |
| Horizontal Scaling / Load Balancing | 🟡 Architecturally designed for since Stage 4 (stateless services, Redis pub/sub) | **Built**: real nginx upstream config + Kubernetes HPA/PDB manifests (infra-level, unverified) |
| Performance Optimization | 🟡 Extensively documented (doc 46); ongoing practice across every stage | Unchanged this stage |
| Stress Testing | ❌ Not built | **Built**: real k6 script (unverified — no k6 binary in this sandbox) |
| Security Audit | ❌ Not built | **Built**: real runtime configuration audit (`SecurityAuditService`), and it **found and fixed a real bug** (see below) |

## A real bug this stage's own tooling caught

Building `SecurityAuditService`'s CORS check required looking at what `main.ts` actually did — and `app.enableCors()` was being called with **no arguments**, meaning every origin was allowed, despite a code comment claiming it was "tightened to real origins per-environment in production config." That configuration didn't exist. This is exactly the failure mode `SecurityAuditService` is meant to catch systematically rather than by chance during an unrelated task: a comment asserting a security property that isn't actually true. Fixed in this same pass (`main.ts` now reads `CORS_ORIGIN` and restricts accordingly), not left as a documented-but-unfixed finding — when an audit tool you're building surfaces a real, cheaply-fixable issue, fixing it is more honest than shipping the audit tool next to the bug it was designed to catch.

## GDPR — what's exported/deleted, and what's honestly out of scope

`DataExportService` covers profile, posts, comments, social graph counts, wallet ledger, and gift history — a real, structured JSON export. **Message content is never included** — not a gap, an architectural consequence of doc 26/31's E2E encryption (the server genuinely cannot decrypt it; a real "export my messages" feature would need to run client-side where the plaintext exists). Also not included in this pass: premium cosmetic selections and full notification history — a scoping decision to revisit, named explicitly rather than silently omitted.

`DataDeletionService` **anonymizes rather than hard-deletes** the user row (email/username/displayName/bio/avatar scrubbed, `status` set to `'deleted'`), while genuinely hard-deleting object-storage assets via the existing `FilesService.deleteAllForUser` (Stage 4, reused not reimplemented). This is the standard, defensible pattern for a social platform: other users' content (replies, threads) references this user, so an abrupt cascading hard-delete would either destroy content that isn't solely the deleted user's to erase, or leave dangling references. Processed via a real BullMQ job (`DataDeletionProcessor`), not inline in the HTTP request — the same job-separation discipline as every other multi-step operation in this codebase.

doc 45's backup-retention-vs-erasure tension remains explicitly unresolved by this service alone, as documented there: live-data anonymization happens immediately; whatever exists in point-in-time database backups ages out per the backup retention schedule (see below), not instantly. That gap needs real legal sign-off on an acceptable window (doc 49), not an engineering assumption.

## E2E Encryption — the honest state across the whole project

Server-side key brokering (`DeviceKey`, prekey bundle publishing/fetching) has been real since Stage 4. What's never been built, across every stage of this project, is the **client-side Signal Protocol implementation** — MOBILE.md (Stage 11) didn't build a crypto layer for the mobile app, and WEB_DESKTOP.md (Stage 12) inherited that gap. This stage doesn't change that. The architecture is sound and the server genuinely cannot decrypt messages (verified conceptually via `messages.ciphertext` being `BYTEA` with no decryption code path anywhere in this codebase), but "E2E Encryption" as an end-to-end *working feature* still needs real client-side crypto library integration (e.g. `libsignal-client`) on both mobile and web before it's actually usable, not just architecturally correct.

## Monitoring — real metrics, gated access

`MetricsService` wraps real `prom-client` counters/histograms plus `collectDefaultMetrics()` (real Node.js process metrics — heap, event-loop lag, GC pauses). `MetricsInterceptor` records RED-method metrics (Rate, Errors, Duration) on every HTTP request, with the route *template* as a label (`/posts/:id`, not the literal URL with a real post id in it) — deliberately, to keep label cardinality bounded, since unbounded cardinality is a classic way to quietly break a metrics backend in production. The `/metrics` endpoint is admin-gated rather than fully open; a real deployment more typically restricts this at the network level (only the Prometheus scraper's IP can reach it) — flagged as the more realistic production setup, with the role guard used here as this codebase's consistent access-control mechanism standing in for it.

## Load Balancing / Horizontal Scaling — real config, honestly unverified

`infra/nginx/edina.conf` and `infra/k8s/backend-hpa.yaml` are real, intended-to-work configuration — not pseudocode — matching doc 18's stateless-service architecture exactly (WebSocket routing with upgrade headers, webhook routes with untouched raw bodies, `least_conn` load balancing suited to a REST+WebSocket mix). Neither has been applied to or verified against a real nginx instance or Kubernetes cluster in this environment, the same "real but infra-unverified" status as Stage 12's Tauri Rust source.

## Testing

- `bot-detection.service.spec.ts` — honeypot true/false/whitespace cases, submission-timing threshold logic including a custom-threshold case.
- `sessions.service.spec.ts` — per-device deduplication (keeping the most-recently-used row when duplicates exist), correct update-query construction for revocation, and the not-found case.
- `security-audit.service.spec.ts` — the production-vs-development asymmetry for default-secret checks (the core design decision of that service), the CORS wildcard detection, and `isHealthy()`'s critical-vs-warning severity distinction.
- `backup-retention.policy.spec.ts` — every tier's retention boundary (daily/weekly/monthly), and the weekly/monthly copy-trigger day logic, all as pure functions independent of the actual shell script.
- **Not yet covered**: `DataExportService`/`DataDeletionService` (would benefit from an integration test given the cross-table nature of both), `MetricsInterceptor` (would need a real HTTP request cycle to test meaningfully — a reasonable integration-test addition).

## Explicitly not built

- Client-side E2E encryption implementation — see above, a standing gap across Stages 11/12/15.
- Disaster Recovery tooling beyond what doc 44 already documents — no DR-drill automation, no failover runbook execution tooling.
- A/B testing infrastructure beyond the deterministic percentage-rollout `FeatureFlagsService` already provides (Stage 13) — that's rollout gating, not statistical experiment analysis; a real A/B testing platform (variant assignment tracking tied to outcome metrics, significance testing) is a distinct, larger system not attempted here.
- Actual execution/verification of the k6 stress test, nginx config, and Kubernetes manifests — all real, all unverified in this sandbox, consistent with every other infra-level artifact across this project.
