# 41 — Git Strategy

## Branching Model
Trunk-based development with short-lived feature branches — not GitFlow's long-lived `develop`/`release` branch structure, which adds merge overhead disproportionate to this team's size and doesn't meaningfully help with the milestone-based, continuously-integrated delivery approach the project brief calls for.

- `main` — always deployable (per doc 34's rolling-deploy/backward-compatible-migration requirements), protected (doc 36).
- Feature branches: `feat/<short-description>`, `fix/<short-description>`, branched from `main`, merged back via PR within days, not weeks — long-lived branches are actively discouraged since they're a common source of painful merge conflicts and drift from the milestone-sized-work principle in doc 03.
- Release branches: created only at the point of cutting a mobile app-store release (`release/x.y.z`), since mobile releases (unlike backend/web, which deploy continuously) need a stable point-in-time snapshot while store review is pending and hotfixes might need to target that exact version independent of `main`'s continued progress.

## Commit & PR Practices
- Conventional Commits (doc 40) on every commit.
- PRs scoped to a single milestone or a clear sub-piece of one (ties directly to doc 03's "milestone" unit of work) — a PR implementing "user can register with email" is reviewable; a PR implementing "the entire auth module" is not, and is a signal the milestone was sized wrong per the brief's own "hundreds of small milestones" instruction.
- PR description template includes: which milestone/requirement ID(s) it addresses (doc 04's ID scheme), what was tested, and any doc cross-references for non-obvious decisions.

## Versioning
Semantic Versioning (`MAJOR.MINOR.PATCH`) for the mobile app (store-visible) and for the shared `packages/api-types` (so mobile/web can pin compatible versions during the brief transition periods a monorepo otherwise mostly avoids needing). Backend/web deploy continuously and are identified by git SHA (doc 34) rather than a user-facing semantic version, since there's no "install" step for users to reason about a version number for.

## Tagging
Every production deploy tagged (`prod-YYYY-MM-DD-<short-sha>` for backend/web continuous deploys, `v1.2.3` for mobile store releases) — enables the fast rollback path from doc 34 and gives a clear audit trail correlating a point in time with exactly what code was live, useful for incident review (doc 44) and security investigation (doc 31).

## Code Review Requirements
Minimum one approving review before merge (doc 36's branch protection), with review depth scaled to risk — security/auth/crypto-touching PRs (doc 31) require review from whoever owns that area specifically, not just any available reviewer, formalized as a CODEOWNERS file mapping sensitive paths (`apps/backend/src/modules/auth/**`, `packages/crypto/**`) to required reviewers.

## Hotfix Process
A production-breaking bug gets a `hotfix/` branch off the relevant `release/` tag (mobile) or off `main` directly (backend/web, since those don't have the release-branch concept above), fast-tracked through the same CI gates (doc 36) — no CI bypass even under time pressure, since a rushed change that breaks something else compounds the original incident rather than resolving it.
