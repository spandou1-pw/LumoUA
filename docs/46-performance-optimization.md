# 46 — Performance Optimization

Consolidates performance practices referenced throughout earlier docs against the concrete targets in doc 05 — this doc is the canonical checklist, not a duplicate of the architecture decisions themselves.

## Mobile (against doc 05 NFR-PERF-1/2)
- Cold start: minimize JS bundle size (code-splitting by route/feature where Expo/Metro tooling supports it), defer non-critical initialization (analytics SDK init, non-visible-tab data prefetch) until after first paint.
- List rendering: `FlashList` everywhere (doc 17), never `FlatList`/`ScrollView`-with-`.map()` for any list that could grow beyond a screenful.
- Images: served pre-sized for the actual display dimensions (doc 30's responsive pipeline), never a full-res original downscaled client-side — client-side downscaling wastes bandwidth and decode time.
- Animation: UI-thread-only via Reanimated worklets (doc 16), verified against the mid-tier reference device, not just a high-end development device (a common false-confidence trap — an animation feels smooth on an engineer's flagship test phone and janks on the actual median user device).

## Network (against doc 05 NFR-PERF-3/4)
- Payload size: GraphQL queries (doc 22) request only the fields a given screen actually renders — no blanket "fetch everything" queries that happen to be convenient to write.
- Compression: gzip/brotli on all API responses.
- Optimistic UI universally applied to user-initiated writes (send message, like, post) so perceived latency is near-zero regardless of actual network round-trip time — the actual round-trip still matters for eventual consistency/correctness, but the user-perceived experience is decoupled from it.
- Request batching/deduplication: React Query's built-in deduplication relied on (doc 17) rather than reimplemented; DataLoader batching on the backend for N+1-prone resolvers (doc 27).

## Backend (against doc 05 NFR-PERF-3, and general API responsiveness)
- Database query performance: every list-returning endpoint has a corresponding index verified at review time (doc 20's index notes are the starting inventory, not exhaustive — new query patterns get their own index review), `EXPLAIN ANALYZE` checked for any query touching a high-volume table before merge.
- Caching: Redis caching applied deliberately at specific, identified hot paths (feed pages per doc 27, hot profile lookups) rather than reflexively cached everywhere — over-caching introduces invalidation complexity and staleness bugs disproportionate to the benefit for low-traffic paths.
- Connection pooling (PgBouncer, doc 18) sized and monitored (doc 37) rather than left at default values that may not suit actual concurrency patterns.

## Web (against doc 05, extended to web-specific concerns)
- Code splitting per route (doc 19), lazy-loading non-critical UI (e.g. the compose sheet's rich media picker) rather than including it in the initial bundle.
- Service worker (doc 19's PWA setup) caches the app shell aggressively while explicitly not caching API responses long-term, balancing fast repeat-load against data freshness.

## Measurement Discipline
Every performance claim in doc 05 is tied to a measured metric in doc 37, not asserted once and assumed to hold — performance work is validated against the mid-tier reference device/network profile (doc 05's explicit reference point) at defined checkpoints (doc 43's capacity-planning cadence, and before any mobile store release per doc 42), not only during initial feature development when the codebase is smallest and least representative of real-world conditions.

## Anti-Patterns Explicitly Disallowed
- Blocking the JS/UI thread with synchronous crypto operations (doc 26's Signal Protocol operations must run off the main thread on mobile — a real, easy-to-introduce performance bug given how naturally "just call the encrypt function" reads in application code).
- Polling where a WebSocket event already exists for the same data (doc 18/22) — polling is only the sanctioned fallback for restrictive network environments (doc 19), never a default implementation choice.
- Unbounded list queries without pagination (doc 22's cursor-pagination convention applies universally, no exceptions for "this list is probably small").
