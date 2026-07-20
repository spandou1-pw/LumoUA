# 43 — Scalability Plan

## Philosophy
Build for the next order of magnitude, not for a hypothetical millions-of-users scale from day one — over-engineering Phase 1 for scale it won't see for years wastes the "small milestones" delivery capacity the brief emphasizes. This doc identifies the concrete, specific scaling triggers already flagged throughout Track C, collected here as a single forward-looking reference, plus the ones not yet covered.

## Already-Flagged Scaling Triggers (cross-referenced, not repeated in full)
- Feed: fan-out-on-read → fan-out-on-write, triggered by high-follower-count accounts making read-time queries expensive (doc 27).
- Backend modules: `chat` and `feed`/`search` are the first extraction candidates from the modular monolith into standalone services, triggered by WebSocket load profile or read-scaling needs diverging meaningfully from the rest of the API (doc 18).
- Search: dual-write → proper CDC (Debezium or equivalent), triggered by observed data-drift issues, not preemptively (doc 29).
- Video: transcoding provider decision (managed vs. self-hosted) revisited once real volume/cost data exists (doc 30).

## Database Scaling Path
1. Vertical scaling (bigger instance) — the simplest first lever, sufficient for a meaningful range of growth on modern managed Postgres offerings.
2. Read replicas for read-heavy paths (feed queries, search-adjacent lookups) — application already structured to route reads separately where it matters (doc 18), so this is largely a routing/connection-config change, not an application rewrite.
3. Partitioning/sharding — deferred as a genuinely last-resort lever given its operational complexity; the specific candidate for eventual partitioning is the `messages` table (naturally partitionable by `conversation_id` or time), flagged now so the schema (doc 20) isn't accidentally designed in a way that makes future partitioning harder (e.g. avoiding cross-partition foreign keys where avoidable).

## Real-Time Layer Scaling
WebSocket gateway pods scale horizontally behind the Redis pub/sub backplane (doc 18) — the concrete trigger to watch is Redis pub/sub throughput and per-pod connection count approaching provider/instance limits, at which point Redis Cluster (sharded pub/sub) or a purpose-built message broker (e.g. NATS) would be evaluated against real throughput numbers, not adopted preemptively.

## Media/CDN Scaling
Cloudflare's CDN and R2's architecture are already built for scale beyond what this platform will need for a long time (doc 30) — the more likely near-term scaling concern is transcoding throughput (video pipeline) once video posts (Phase 2) see real volume, addressed by the provider decision flagged in doc 30.

## Capacity Planning Cadence
Quarterly review (informal at first, formalized once traffic is meaningful) of the metrics from doc 37 against the triggers listed above — the point of collecting these triggers in one document is so capacity planning is "check these specific numbers against these specific thresholds," not a vague, hard-to-operationalize "keep an eye on scale."

## What This Plan Deliberately Does Not Do
Pre-build sharding, multi-region active-active deployment, or a fully event-sourced architecture speculatively — each is a legitimate future direction if and when the specific trigger conditions above are met, but committing to them now would be exactly the kind of premature complexity the brief's emphasis on production-readiness should not be confused with.
