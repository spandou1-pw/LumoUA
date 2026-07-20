# 38 — Testing

## Testing Philosophy
Match test investment to risk and change-frequency, not a blanket coverage percentage (doc 05 NFR-MAINT-2) — cryptographic/security-critical code (doc 26/31) and authorization logic (doc 24) warrant near-exhaustive testing; UI-presentational code warrants lighter, behavior-focused testing; both are "well tested" for their context, but that means different things.

## Test Types & Ownership

### Unit Tests
- Backend: NestJS service/provider logic, isolated with mocked dependencies (Jest). Target: business logic (authorization checks, feed assembly rules, moderation state transitions) at high coverage; thin controller/DTO glue code at lower priority.
- Mobile/Web: component logic and hooks (React Testing Library + Jest/Vitest), focused on behavior ("clicking like toggles the liked state and count") not implementation detail ("component calls `setState` with X") — implementation-detail tests break on harmless refactors and erode trust in the suite over time.

### Integration Tests
- Backend: real Postgres/Redis/Elasticsearch (ephemeral, per doc 36's CI setup) exercising actual API endpoints end-to-end within the service boundary — this is where authorization rules (doc 24) and the privacy-settings-as-authorization-input principle get their most important coverage, since a unit test with mocked auth would miss exactly the kind of bug that principle warns about.
- Contract tests between mobile/web clients and the backend API, generated from the shared schema (doc 22) — catch breaking API changes before they reach a real client build.

### End-to-End (E2E) Tests
- Critical user flows from doc 08 (onboarding, send message, create post, report content) automated via Detox (mobile) and Playwright (web) against a real staging-like environment.
- Kept deliberately small in number relative to unit/integration tests (the standard testing-pyramid rationale: E2E tests are slow and flakier) — E2E coverage targets the flows in doc 08 specifically, not exhaustive feature coverage, which unit/integration tests handle more reliably.
- A small, fast E2E subset runs as the post-deploy staging smoke test (doc 36).

### Security-Specific Testing
- E2E encryption: dedicated test suite verifying the Signal Protocol implementation against known test vectors, plus tests confirming the server genuinely cannot decrypt message content (e.g. a test that asserts no code path exists between the ciphertext storage and any plaintext-producing function) — testing the *absence* of a capability is unusual but directly validates doc 31's core privacy claim.
- Authorization: a systematic test matrix per resource type (doc 24's table) covering owner/non-owner/blocked/moderator/admin access attempts for every mutating endpoint — not just happy-path tests.
- Search privacy: explicit tests confirming private-account content never surfaces in another user's search results (doc 29's flagged security-relevant detail).

### Load/Performance Testing
Against the specific numeric targets in doc 05 (message delivery p95, feed load time) using a load-testing tool (k6 or similar) run against staging before major releases and after significant architecture changes (e.g. before/after the fan-out-on-write feed migration flagged in doc 27) — not continuous, but triggered at meaningful checkpoints.

### Accessibility Testing
Automated (axe-core or equivalent integrated into E2E runs) catches a baseline of WCAG violations; manual screen-reader testing (VoiceOver/TalkBack) for the core flows required by doc 05 NFR-A11Y-2, since automated tools alone don't catch real usability issues for assistive technology.

## Test Data
No production data used in any test environment (ties to doc 34's environment isolation and doc 49's legal review) — synthetic fixtures and factories only, which also satisfies the project's "never use fake data" rule in a different sense: fake data is fine and necessary *for tests*, the rule against fake data applies to production/user-facing content, and this doc makes that distinction explicit to avoid confusion between the two contexts.
