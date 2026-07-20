# 42 — Release Strategy

## Backend & Web: Continuous Delivery
Every merge to `main` that passes CI (doc 36) is deployable to staging automatically and to production via the manual promotion gate (doc 35) — no batched "release trains"; this matches the milestone-based incremental delivery the project brief specifies (finish one milestone, ship it, move to the next), rather than accumulating changes for a big-bang release.

## Mobile: Store-Gated Releases
Mobile can't follow the same continuous model due to app store review latency (typically 1–3 days, sometimes longer) — release cadence proposal: a regular cutoff (e.g. every 2 weeks) bundling accumulated `main` changes into a `release/x.y.z` branch (doc 41), submitted for store review, with OTA updates (doc 36) handling JS-only fixes between store releases where appropriate.

## Feature Flags & Phased Rollout
Incomplete or risky features ship behind a flag (doc 18's lightweight flag-table approach in Phase 1) rather than via a long-lived branch — code merges to `main` (satisfying "no unfinished code left unmerged" concerns around branch staleness) while the feature stays dark until intentionally enabled. Phased rollout (percentage-based flag enablement) used for higher-risk changes (e.g. the fan-out-on-write feed migration flagged in doc 27) to catch issues on a small population before full exposure.

## Backward Compatibility Window
Per doc 18's API versioning note: the backend must support at least the current and previous mobile app-store release's API expectations simultaneously, since users update at different rates and a hard cutover would break users on an older build. Deprecation policy: an API version deprecation gets a minimum notice window (proposal: one full mobile release cycle) communicated via response headers/logging (visible to engineering monitoring adoption, doc 37) before removal.

## Release Notes & Changelog
Generated from Conventional Commits (doc 40/41) for internal/engineering changelogs; user-facing release notes for mobile store releases are hand-written in plain, specific language (per doc 15's copy principles — "what changed and why it matters to you," not a raw commit dump).

## Kill Switch
A small set of critical features (e.g. new post creation, new message sending) have an emergency-disable flag reachable without a full deploy (a runtime-toggleable flag, not a config requiring redeploy) — for the scenario where a released feature is actively causing harm (security issue, data corruption bug) and the fastest safe response is "turn it off" rather than "wait for a fixed build to roll out," which ties directly into doc 44's incident response posture.
