# 36 — CI/CD

## Platform
GitHub Actions, per the brief's stated tooling choice.

## Pipeline Stages (on every PR)
1. **Lint** — ESLint + Prettier (backend, web), ESLint + Prettier (mobile), consistent shared config across `packages/` (doc 19's shared-types package extends to shared lint config too, avoiding style drift between apps).
2. **Typecheck** — `tsc --noEmit` across all workspaces; strict mode enforced (doc 17).
3. **Unit tests** — per-package, thresholds defined in doc 38.
4. **Integration tests** — backend, against an ephemeral Postgres/Redis/Elasticsearch spun up in the CI job (via Docker Compose or GitHub Actions service containers), not mocked at the database layer for these tests specifically, since integration tests exist to catch real query/schema issues mocks would hide.
5. **Build** — Docker image build (backend), production bundle build (web), Expo build check (mobile) — a failed production build blocks merge, catching build-config drift early rather than at actual release time.
6. **Security scanning** — dependency vulnerability scan (Dependabot alerts as a required check, not just passive notification) + container image scan (e.g. Trivy) — per doc 31, known-critical vulnerabilities block merge.
7. **API contract check** — generated OpenAPI/GraphQL schema diffed against doc 22's described contract (doc 22's stated CI-enforced tolerance) — flags undocumented breaking changes before they reach staging.

## Branch Protection
`main` requires: all checks above passing, at least one approving code review, no direct pushes (even for admins — an intentional, not accidental, hard rule, since exceptions to this are exactly where bad deploys originate). Ties to doc 41 (Git Strategy) for the branching model this pipeline assumes.

## Deployment Pipeline (continuation of doc 34's promotion flow)
- Merge to `main` → CI pipeline above → auto-deploy to `staging` (Docker image push, Helm upgrade via Argo CD or a GitHub Actions-driven `kubectl`/`helm` step — Argo CD preferred if the team wants GitOps-style drift detection, otherwise a simpler push-based Action is acceptable for this team size; final tool choice not over-specified here since it's a low-risk, easily-changed implementation detail).
- Staging smoke tests (a small, fast subset of E2E tests against the real staging deployment, doc 38) run automatically post-deploy.
- Manual promotion to `production` (doc 35) triggers the same image/chart, promoted rather than rebuilt — production always runs an artifact that was already validated in staging, never a separately-built artifact (eliminates a whole class of "worked in staging, different in prod" issues stemming from build nondeterminism).

## Mobile Release Pipeline
EAS Build + EAS Submit (Expo's managed pipeline) triggered on release-tagged commits (doc 41) — builds signed iOS/Android binaries and submits to App Store Connect / Google Play Console review queues; OTA updates (Expo Updates) used for JS-only changes that don't require a native rebuild/app-store review, with a clear internal policy on what qualifies for OTA vs. requires a full store release (security-sensitive or native-module changes always go through full review, never OTA-only).

## Required Status Checks Summary
No PR merges without: lint + typecheck + unit tests + integration tests + build + security scan all green. This is the concrete enforcement mechanism behind the brief's "never leave unfinished code" / "no unfinished code merged to main" rules — stated as policy in earlier docs, implemented here as an actual gate.
