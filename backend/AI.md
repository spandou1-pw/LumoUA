# AI.md — AI Platform (Stage 14)

## The boundary that shapes every decision in this stage

Doc 33 established this back in the original documentation pass, and nothing in this stage changes it: **AI classification produces a flag for human review — it never removes content or changes an account by itself**, except the already-established CSAM-hash exception (doc 32, untouched here). Every "AI-powered" feature in this stage either (a) files into the existing Stage 13 Reports queue for a human moderator to act on, or (b) is a real, deterministic heuristic/algorithm that needs no model and no human-in-the-loop caveat because it isn't making a judgment call about content — it's computing a graph distance or a decay curve.

## What's real vs. stubbed — the honesty standard from every prior stage, applied here

| Component | Status |
|---|---|
| Content Moderation orchestration (`ContentModerationService`) | ✅ **Real** — runs the safety filter synchronously, calls the AI classifier best-effort, creates flags/Reports, all real logic |
| Text classification (hate speech, harassment, etc.) | ⚠️ **Stubbed** — `TextModerationProvider` needs a real `TEXT_MODERATION_API_KEY` (Perspective API or similar). Throws clearly, never returns fake "all clear" |
| Image/Video Moderation | ⚠️ **Stubbed** — `VisualModerationProvider` needs `VISUAL_MODERATION_API_KEY` (AWS Rekognition / Cloud Vision / Azure). Video is handled as periodic frame sampling through the same classifier, not a separate model (doc 33's proportionality reasoning) |
| Safety Filters | ✅ **Fully real** — DB-managed keyword/regex matching, zero external dependency, runs synchronously. **No sensitive terms are hardcoded in this codebase** — the list is entirely admin-managed at runtime (see below) |
| Spam Detection | ✅ **Fully real** — duplicate-content hashing, velocity limiting, new-account link-spam pattern. All deterministic, all unit-tested |
| Fake Account Detection | ✅ **Real** deterministic risk scoring (profile completeness, follow-burst pattern, generated-looking email pattern). Explicitly does NOT include a disposable-email-domain hardcoded list — that would go stale immediately and create false confidence; a real deployment needs a maintained third-party list/service for that specific signal |
| Friend Recommendations | ✅ **Fully real** — mutual-connections graph algorithm, no ML. This is genuinely how most platforms' "people you may know" works at this scale |
| Feed Recommendations | ✅ **Real scoring formula** (recency decay × engagement, comments weighted above likes per doc 28) + **real event logging** for future ML training data. NOT wired into the default Following/Global feeds (doc 27) — this is doc 28's own "Phase 1-2 groundwork," a distinct future "Recommended" tab, not a replacement for the reverse-chronological default |
| Search Ranking | ✅ **Real scoring function**, ⚠️ **not wired to anything** — doc 29's Elasticsearch integration itself still doesn't exist (flagged "Not started" since Stage 5 and unchanged since). The formula is ready the moment Search exists |
| Automatic Translation | ⚠️ **Stubbed** — `TranslationProvider` needs `TRANSLATION_API_KEY`. Scoped as an explicit opt-in action only, per doc 48's rule that user-generated content is never silently translated by default |
| Comment Moderation | ✅ Uses the same `ContentModerationService`/`SafetyFiltersService` pipeline as posts — not a separate system |
| Testing | ✅ Every REAL component above has dedicated unit tests (104 total across this stage's additions) |
| Documentation | This file |

## Why Safety Filters ships with an empty term list, not a starter blocklist

`SafetyFilterTerm` rows are entirely admin-managed via `SafetyFiltersAdminController` — this codebase does not seed, hardcode, or suggest any actual sensitive terms. Two reasons, both concrete: (1) a list committed to source control is public and trivially bypassable the moment anyone reads this repository, defeating its purpose; (2) real abuse patterns (including Ukrainian-specific slang/obfuscation, doc 33's stated language-quality concern) are something moderators observing real reports should curate, not something an engineering pass should guess at. The mechanism is real and tested; the content of the list is a moderation-team decision, not a code decision.

## The `Report.reporterId` nullability fix — a real bug caught before shipping

`ModerationActionsService`'s first draft filed AI-generated reports using a sentinel string (`'system-ai-moderation'`) as `reporterId`. That column is a real foreign key to `users(id)` typed `uuid` — a sentinel string would have failed at the database level on the very first AI-flagged post (wrong type, and no matching user row even if the type coincidentally worked). Fixed by making `reporterId` nullable and adding an explicit `filedByAi` boolean, which is also more honest data modeling: an AI-filed report genuinely has no human reporter, and pretending otherwise with a fake user id would have made the moderation queue's data lie about its own provenance.

## Comment Moderation and Image/Video Moderation — not separate systems

The Stage 14 request lists Comment Moderation, Image Moderation, and Video Moderation as if they might be distinct systems from "Content Moderation." They aren't, deliberately: `ContentModerationService.screenText` is called for both posts and comments (via the same `post.created`-style event pattern), and `VisualModerationProvider` handles both images and sampled video frames through the same classifier interface. One pipeline, multiple content types feeding into it — consistent with doc 18's "one code path per concern" discipline applied throughout this whole project.

## Testing

- `spam-detection.service.spec.ts` — pure-function tests for content hashing (normalization) and link density, plus integration-style tests for all three heuristics (duplicate content, velocity, new-account link spam) including negative cases (old accounts, short trivial text) that confirm the heuristics don't over-trigger.
- `safety-filters.service.spec.ts` — literal and regex matching, highest-severity-wins when multiple terms match, fail-closed behavior on an invalid regex (never throws into the caller), and cache behavior.
- `fake-account-detection.service.spec.ts` — low score for a normal established account, the mass-follow-burst signal, score capping at 100, and a negative case for a short real-looking email (avoiding the false-positive the "no vowels" heuristic could otherwise create).
- `ranking.spec.ts` — both `FeedRankingService` and `SearchRankingService`'s scoring functions: recency ordering, engagement ordering, the comment-vs-like weighting doc 28 specifies, and sort correctness.
- `friend-recommendations.service.spec.ts` — mutual-count ranking, exclusion of already-followed and blocked users, empty-graph edge case.

## Explicitly not built

- Any code path that removes content or suspends an account based purely on an AI classification — see the boundary statement at the top of this document.
- A trained ML model of any kind — this sandbox cannot train or run one; every "AI" component here is either a real deterministic algorithm or an honest integration stub for a real third-party service.
- Search Ranking wired to a live endpoint — blocked on doc 29's Elasticsearch integration, unchanged status since Stage 5.
- A disposable-email-domain list for fake-account detection — flagged as needing a maintained external source, not a stale hardcoded list.
