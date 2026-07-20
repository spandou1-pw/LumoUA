# 03 — Roadmap

This roadmap sequences the full 50-document plan and downstream implementation. It replaces "generate everything at once" with a track-based approach so each doc is grounded in decisions made in earlier ones, rather than guessed.

## Track A — Foundation (docs 01–09)
Vision, PRD, this roadmap, functional/non-functional requirements, UX research, personas, user flows, information architecture.
**Blocked on:** decisions listed in doc 02 (name, monetization, data residency, phasing, E2E protocol).

## Track B — Design System (docs 10–16)
Design system, UI kit, color palette, typography, iconography, components, animations.
**Depends on:** Track A personas/flows.

## Track C — Technical Architecture (docs 17–31)
Mobile, backend, web architecture; DB schema & ER diagrams; API spec; auth/authz; notifications; chat, feed, recommendation, search, storage architecture; security.
**Depends on:** Track A functional/non-functional requirements.

## Track D — Trust & Safety (docs 32–33)
Moderation, AI moderation.
**Depends on:** Track C (data model, storage) + legal decisions.

## Track E — Operations (docs 34–48)
Deployment, DevOps, CI/CD, monitoring, testing, folder structure, coding standards, git strategy, release strategy, scalability, disaster recovery, backup, performance, accessibility, i18n.
**Depends on:** Track C.

## Track F — Legal & Wrap-up (docs 49–50)
Legal considerations, final implementation roadmap (the actual milestone breakdown into "hundreds of small milestones").

## Implementation Philosophy
Once Tracks A–C are in place, implementation proceeds as small, independently shippable milestones (target: 1 vertical slice of functionality per milestone — e.g. "user can register with email and see an empty profile screen on iOS/Android/Web," not "build auth system"). Each milestone gets its own goal, file list, tests, and acceptance criteria, reviewed before moving to the next, per the original brief's implementation rules.

Given the size of this project, milestones will be tracked in a running `MILESTONES.md` log (created once Track A decisions are finalized) rather than pre-enumerated now — pre-enumerating hundreds of milestones before the schema/API/design system exist would just produce speculative work that gets rewritten.

## Immediate Next Step
Confirm the `[DECISION NEEDED]` items in doc 02, then proceed to docs 04–05 (functional/non-functional requirements) and 06–09 (UX research through information architecture) before any code is written.
