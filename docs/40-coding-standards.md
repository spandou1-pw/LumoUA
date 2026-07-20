# 40 — Coding Standards

## TypeScript
- `strict: true` across every package, no exceptions checked in without an explicit, reviewed `// @ts-expect-error` comment explaining why (never a bare `// @ts-ignore`, which silently suppresses future errors on the same line too).
- No `any` — use `unknown` + narrowing, or a properly modeled type, at review time; an `any` in a PR is a specific, callable-out review comment, not a style nitpick.
- Prefer explicit return types on exported functions — aids readability and catches accidental type-widening at the function boundary rather than at some distant call site.

## Formatting & Linting
Prettier (formatting) + ESLint (correctness/style rules) via the shared `packages/eslint-config` (doc 39), enforced in CI (doc 36) — not a suggestion; a PR with lint errors doesn't merge. No bikeshedding formatting in code review, since Prettier removes that argument by construction.

## React / React Native
- Functional components + hooks exclusively — no class components in new code.
- Props typed explicitly (no implicit `any` props, per the TypeScript rule above).
- Custom hooks extract reusable stateful logic once it's used in 2+ places — not preemptively abstracted before a second use case exists (avoids speculative, wrong abstractions).
- No inline styles with magic numbers — all spacing/color/type values sourced from `packages/ui-tokens` (doc 10's governance rule, enforced here at the code-standard level).

## NestJS/Backend
- DTOs + `class-validator` decorators on every controller input (doc 31's validation requirement, made concrete).
- Services contain business logic; controllers stay thin (routing, validation, calling the service, shaping the response) — keeps business logic testable in isolation (doc 38's unit-test target) rather than entangled with HTTP concerns.
- No raw SQL string concatenation, ever (doc 31) — query builder or fully parameterized raw queries only.

## Comments & Documentation
- Comments explain **why**, not **what** — code should be legible enough that a comment restating "increment the counter" next to `counter++` is a smell, not a norm. Reserve comments for non-obvious rationale, tradeoffs, or links to the relevant doc in this 50-doc set (e.g. `// see doc 26: message deletion purges ciphertext, not just flags it`).
- Every module/service gets a brief header comment stating its responsibility and its doc cross-reference — a lightweight, low-maintenance-cost way to keep code and documentation traceable to each other as both evolve.

## Prohibited Patterns (explicit, per the project brief's own rules)
- No `TODO` comments left in code merged to `main` — if work is genuinely incomplete, it isn't merged; if it's a deliberate future-phase deferral, it's tracked in the relevant doc (e.g. doc 03's phasing) or a tracked issue, not a floating code comment that tends to be forgotten.
- No placeholder/mock API responses in code paths reachable in staging or production — mocked data lives exclusively in test fixtures (doc 38), never in application code that could accidentally run against real users.
- No commented-out dead code left in commits — version control is the history; a commented-out block is noise that decays into confusion about whether it's meant to come back.

## Commit Standards
Conventional Commits format (`feat:`, `fix:`, `chore:`, `refactor:`, etc.) — enables automated changelog generation and makes the git history itself a usable, searchable record of what changed and why, feeding into doc 41's release strategy.
