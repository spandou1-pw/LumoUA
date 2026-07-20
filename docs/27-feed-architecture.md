# 27 — Feed Architecture

## Phase 1: Reverse-Chronological (No ML Ranking)
Per doc 03/04 (FEED-1, FEED-2), Phase 1 ships without a recommendation model — deliberately, since a cold-start ML ranking system with no engagement data would produce worse results than a simple, predictable chronological feed, and predictability also matches the "time-well-spent, not extractive" pillar from doc 01.

### Following Feed
Fan-out-on-write vs fan-out-on-read tradeoff:
- **Fan-out-on-read** (compute the feed at request time by querying posts from followed users, ordered by `created_at`) chosen for Phase 1 — simpler, no write-time amplification cost, and acceptable at Phase 1 scale where follower counts per user are modest. Query: `posts WHERE author_id IN (SELECT followee_id FROM follows WHERE follower_id = :me) ORDER BY created_at DESC` with cursor pagination (doc 22), backed by the `follows(follower_id)` and `posts(author_id, created_at DESC)` indexes from doc 20.
- **Fan-out-on-write** (pre-compute each follower's feed into a per-user feed table/cache on post creation) becomes necessary once high-follower-count accounts (Persona 1, Community Admins) make the read-time query expensive — flagged as the concrete trigger for revisiting this decision (a specific, measurable scaling threshold, not "someday"), likely alongside Phase 2/3 when community-driven growth is expected.

### Global Feed
Same reverse-chronological approach across all public posts, with basic spam filtering (excludes posts from `status = suspended` users and anything already actioned by moderation) — not a "everything, unfiltered" firehose.

## Caching Strategy
Redis cache for feed pages (short TTL, ~30–60s) keyed by `user_id + cursor` — reduces repeated-query load for users refreshing frequently, invalidated opportunistically rather than aggressively precise (a slightly stale feed for under a minute is an acceptable tradeoff against the complexity of perfect real-time cache invalidation on every relevant write).

## Phase 3: Recommended Feed
Specified in doc 28 (Recommendation Engine) — this doc's Phase 1/2 chronological approach remains available as the "Following" feed permanently; Recommended is an additive third feed type (per doc 09 IA's deferred-tab note), not a replacement.

## Feed Item Assembly (GraphQL, doc 22)
Each feed query resolves: post content, author summary (avatar/name/username), media, and viewer-specific engagement state (liked/bookmarked — requires a per-viewer join, batched via DataLoader to avoid N+1 queries across the page of results) in a single response, keeping mobile/web feed screens to one network round-trip per page per doc 05's performance targets.

## Content Exclusion Rules (apply to both feed types)
- Blocked users' content never appears (either direction).
- Muted users' content excluded from Following feed specifically (mute is a one-way "quiet this person" signal, doesn't affect their ability to see the muter's content, per doc 04 GRAPH-4).
- Soft-deleted posts (`deleted_at IS NOT NULL`) excluded at the query level, not filtered client-side.
