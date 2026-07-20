# 29 — Search Architecture

## Stack
Elasticsearch, populated via change-data-capture from Postgres (Phase 1 approach: application-level dual-write on create/update/delete of indexed entities, wrapped in a service so it's a single call site, not scattered writes; revisit a proper CDC pipeline (e.g. Debezium) if dual-write drift becomes a real observed problem rather than a theoretical one).

## Indices (Phase 1)
- `users` index: `username`, `display_name`, `bio` — supports SEARCH-1 people search.
- `posts` index: `body`, `author_username`, `hashtags` (extracted at write time via a simple `#\w+` parse — full hashtag entity modeling deferred, doc 04 doesn't require a separate hashtag table for Phase 1) — supports SEARCH-1 post/hashtag search.

Private-account and blocked-relationship filtering is applied as a **post-query filter using the requester's ID**, not baked into the index itself (since visibility is relationship-dependent per-viewer, not a static document property) — this is called out explicitly as a security-relevant implementation detail: search must never leak private-account content just because Elasticsearch found a text match, and must be tested accordingly (doc 38).

## Ukrainian-Language Analysis (SEARCH-3, Phase 3 per doc 04, foundational choice made now)
Default Elasticsearch analyzers are English/Latin-script-tuned and handle Ukrainian's rich inflection (case endings, etc.) poorly out of the box — a search for "книга" (book) should match "книгу", "книги", etc. Phase 1 uses Elasticsearch's built-in Ukrainian analyzer (ICU + stemming) rather than the `standard` analyzer as the baseline — this is a Phase 1 decision, not deferred to Phase 3, since retrofitting proper language analysis onto an already-populated index later means a full reindex; getting the analyzer right early avoids that rework. Phase 3's SEARCH-3 work is the *tuning/quality* pass (slang, informal Ukrainian, mixed Ukrainian/English/transliterated text common in real usage) on top of this Phase 1 foundation, not standing up Ukrainian search from scratch.

## Query Approach
- Multi-match query across relevant fields with field boosting (e.g. exact username match boosted above bio-text match for people search).
- Typo tolerance via `fuzziness: AUTO`.
- Result blending for the unified search UI (doc 09/15): separate queries per type (people/posts/hashtags) executed in parallel, merged/sectioned in the API response rather than a single blended-relevance query across heterogeneous types, since relevance scoring isn't meaningfully comparable across a username match and a post-body match.

## Scaling Notes
- Elasticsearch cluster sized independently from Postgres — read-heavy, tolerant of eventual consistency (a few seconds of index lag after a post is created is an acceptable tradeoff, not a correctness requirement the way transactional data is).
- Reindexing strategy: blue-green index aliasing (build a new index version, swap the alias) for any analyzer/mapping change, so schema evolution doesn't require search downtime.

## In-Chat Search (Phase 2, MSG-9)
This is a materially different problem: message content is E2E encrypted server-side, so server-side Elasticsearch **cannot** index message plaintext (would defeat the encryption model entirely — flagged as a hard constraint, not a convenience tradeoff). In-chat search is implemented **client-side** — the client indexes its own locally-decrypted message history (e.g. via SQLite FTS or a lightweight on-device search library) and searches within that local index. This is specified now, even though it's a Phase 2 feature, because it has a real architectural consequence: it must not be "solved" later by accidentally routing message content through the server-side search pipeline under delivery pressure.
