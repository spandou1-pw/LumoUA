# 37 — Monitoring

## Stack
Prometheus (metrics collection/storage), Grafana (dashboards/alerting), OpenTelemetry (distributed tracing + as the instrumentation standard feeding both metrics and traces) — per the brief's stated choices.

## Instrumentation Standard
Every backend service instrumented via OpenTelemetry SDK from its first commit, not retrofitted later — traces span across service boundaries (API → background job → external call) using consistent trace-context propagation, so a slow request can be diagnosed end-to-end rather than only within one service's logs.

## Core Metrics (RED method: Rate, Errors, Duration — per service/endpoint)
- Request rate, error rate, p50/p95/p99 latency for every REST/GraphQL endpoint and WebSocket event type.
- Database: connection pool utilization, query duration percentiles, slow-query log integration.
- Redis: hit/miss ratio (feed cache, doc 27), pub/sub message throughput (WebSocket backplane, doc 18).
- Elasticsearch: query latency, indexing lag (doc 29's "few seconds of lag" tolerance is a monitored, not assumed, number).
- Background jobs (BullMQ): queue depth, job processing duration, failure/retry rate per job type.

## Product/Business Metrics (distinct dashboard from infra health)
- DAU/MAU, message send volume, post creation rate, moderation queue size/age (ties to doc 32's SLA-tracking-without-public-commitment approach).
- These are tracked for product decision-making, kept in a clearly separate dashboard category from infra/on-call metrics so an on-call engineer isn't sifting through business KPIs during an incident.

## Alerting Philosophy
Alert on symptoms users would notice (elevated error rate, latency breach, queue backing up) rather than on every possible internal metric deviation — alert fatigue from over-alerting is a real, common failure mode that trains people to ignore alerts; each alert defined here should map to an actual runbook entry (doc 35) describing what to do, not just "something is wrong."

## Severity Tiers
- **Critical** (page immediately, even without formal on-call rotation initially — routed to a high-visibility channel/notification): auth service down, message delivery failing broadly, database unreachable.
- **Warning** (visible on dashboard, reviewed during business hours): elevated latency within tolerable bounds, queue depth trending up, cache hit rate degrading.
- **Info** (dashboard only, no notification): normal capacity/usage trend data.

## Logging (complements metrics/traces)
Structured JSON logging (not free-text) across all services, correlated with trace IDs so a log line can be tied back to the specific request/trace that produced it. Per doc 31's privacy requirement: message ciphertext and any other sensitive field explicitly excluded from log output via a redaction middleware, not left to per-call-site discipline.

## Client-Side Monitoring
Crash reporting (mobile: e.g. Sentry or equivalent; web: same tool for consistency) capturing stack traces and device/OS context — **not** capturing message content or other sensitive user data in crash payloads (same redaction principle as doc 31, applied to the client side where it's arguably an easier mistake to make, e.g. an unredacted Redux/Zustand state dump attached to a crash report). Performance monitoring (cold start time, screen transition time) tracked against the specific numeric targets set in doc 05, so "is the app actually meeting its performance NFRs" is a monitored fact, not an assumption.
