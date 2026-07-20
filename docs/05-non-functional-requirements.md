# 05 — Non-Functional Requirements

## Performance
- NFR-PERF-1: Cold start ≤ 2.5s on a mid-tier Android device (e.g. Snapdragon 6-series class, 4GB RAM) on 4G.
- NFR-PERF-2: Feed scroll maintains ≥ 60fps on the same reference device; target 120fps on ProMotion/120Hz-capable devices.
- NFR-PERF-3: Message send-to-delivery p95 latency ≤ 300ms under normal network conditions.
- NFR-PERF-4: Graceful degradation on 3G/unstable connections — optimistic UI for sends, visible retry/queue state, no silent failures.

## Scalability
- NFR-SCALE-1: Backend services stateless where possible, horizontally scalable via Kubernetes HPA.
- NFR-SCALE-2: Database read replicas for feed/search read paths; writes isolated to primary with connection pooling (PgBouncer or equivalent).
- NFR-SCALE-3: WebSocket layer horizontally scalable via a pub/sub backplane (Redis or equivalent) so users on different nodes can still reach each other in real time.

## Availability & Reliability
- NFR-AVAIL-1: Target 99.9% API uptime for core auth/messaging paths post-launch (aspirational for v1, formalized once on real infra with real traffic).
- NFR-AVAIL-2: Disaster recovery plan (doc 44) with defined RPO/RTO — to be quantified once hosting provider and budget are confirmed.

## Security
- NFR-SEC-1: All private message content end-to-end encrypted at rest and in transit (Signal Protocol per doc 02); server never has plaintext access.
- NFR-SEC-2: All other data encrypted in transit (TLS 1.3) and at rest (AES-256 or provider-managed equivalent).
- NFR-SEC-3: Rate limiting on all public-facing endpoints; stricter limits on auth endpoints to resist credential stuffing.
- NFR-SEC-4: Audit logging for all admin/moderation actions.
- NFR-SEC-5: Dependency and container image scanning in CI (see doc 36).

## Internationalization
- NFR-I18N-1: Ukrainian is the default and primary locale; English is secondary. No Russian localization, by product decision (doc 01).
- NFR-I18N-2: All user-facing strings externalized (no hardcoded text) from the first commit — this is a hard rule, not a later cleanup task, since retrofitting i18n is expensive.
- NFR-I18N-3: Date/number/currency formatting locale-aware (Ukrainian conventions by default).

## Accessibility
- NFR-A11Y-1: WCAG 2.1 AA as the baseline target across web and mobile.
- NFR-A11Y-2: Full screen-reader support (VoiceOver/TalkBack) for core flows (auth, feed, chat) by end of Phase 2.
- NFR-A11Y-3: Minimum touch target size 44x44pt; color contrast ratios verified in the design system (doc 10).

## Maintainability
- NFR-MAINT-1: Shared TypeScript types between frontend and backend where feasible (e.g. via a shared package) to reduce API drift.
- NFR-MAINT-2: Test coverage thresholds defined per-package in doc 38 (Testing) — not a blanket percentage, since UI vs. business-logic code warrant different targets.
- NFR-MAINT-3: No module may be merged without passing CI (lint, typecheck, tests) — enforced via GitHub Actions branch protection (doc 36).

## Observability
- NFR-OBS-1: All services instrumented with OpenTelemetry traces; Prometheus metrics for RED (Rate/Errors/Duration) on every API.
- NFR-OBS-2: Grafana dashboards per service, alerting thresholds defined during Track E (Operations).

## Data Residency & Compliance
- NFR-COMPLY-1: EU hosting adopted as default (doc 02) — GDPR applies as baseline compliance target regardless of Ukraine-specific requirements, since diaspora users will access from the EU.
- NFR-COMPLY-2: Ukraine-specific data protection law (Law of Ukraine "On Personal Data Protection") reviewed in doc 49 — flagged as needing real legal review, not just engineering judgment.
