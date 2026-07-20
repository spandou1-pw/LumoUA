# 28 — Recommendation Engine

Status: **Phase 3 design, not Phase 1 build.** Documented now so the data model and event-logging decisions made in Phase 1 (below) don't foreclose Phase 3 options later — the actual model training/serving infrastructure is not built until Phase 3 per doc 03.

## Product Constraint (from doc 01 Pillar 5)
"Optimizes for time-well-spent signals, not pure engagement-maximization" is a concrete design constraint, not a slogan — it rules out a naive approach of ranking purely by predicted click/like/comment probability, which is well-documented to reward outrage/addictive content. Concretely: the ranking objective (once built) must incorporate negative/regret signals (e.g. "hide post," fast-scroll-past patterns, explicit "not interested"), not only positive engagement signals, as first-class inputs — this is a requirement on the eventual model's training objective, stated now so it isn't dropped for expedience under later delivery pressure.

## Phase 1–2 Groundwork (build now, use later)
Even without ML ranking live, Phase 1/2 should log the events a future recommendation model will need, since event data can't be retroactively generated:
- Impression events (post shown in feed, with position and feed-type context) — sampled, not every impression, to control volume/cost.
- Engagement events (like, comment, bookmark, repost, dwell time if measurable).
- Negative signals: explicit "hide"/"not interested" action (this UI affordance should exist even in Phase 1's chronological feed, both because it's independently useful for user control and because it seeds the future model's negative examples).
Event stream: written to a lightweight analytics event table or forwarded to a dedicated analytics pipeline (decision point for doc 37, Testing/Monitoring track, since this overlaps with general product analytics, not solely recommendation-specific infrastructure) — not the primary transactional Postgres tables, to avoid coupling feed-serving performance to analytics write volume.

## Phase 3 Architecture Sketch
- Candidate generation: pull a broader-than-final candidate set (e.g. recent posts from 2nd-degree network, popular-in-network posts) — cheap, high-recall step.
- Ranking: a model (starting point: gradient-boosted trees on engineered features — dwell/engagement/recency/author-affinity — before reaching for deep learning, since GBT models are cheaper to train, easier to debug, and perform competitively at this data scale) scores candidates.
- Re-ranking / diversity pass: explicit rule-based adjustments (don't show 5 posts from the same author consecutively, inject some exploration/diversity) applied after the model score, since pure score-maximization tends to produce homogeneous, filter-bubble-prone feeds — a known failure mode being designed against upfront rather than patched later.
- Serving: precomputed candidate scores refreshed periodically (not real-time re-ranking on every request) for Phase 3's initial scale — real-time serving infrastructure is a later optimization, not a Phase 3 requirement.

## Explicit Non-Goals
- No engagement-maximizing infinite-scroll dark patterns (e.g. artificially withholding "you're caught up" states) — the feed should tell users clearly when they've seen everything new, consistent with doc 01's non-extractive pillar.
- No fully black-box ranking with zero user control — the "why am I seeing this" / "not interested" controls from the groundwork section above are a permanent product requirement, not a v1-only concession.

## Open Question for Phase 3 Planning
Whether personalization runs per-user in real time or as a periodically-refreshed batch job is a cost/freshness tradeoff that should be decided against real Phase 1/2 usage data and infra budget at the time, not speculatively locked in now.
