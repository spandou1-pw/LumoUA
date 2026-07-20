# 50 — Final Implementation Roadmap

This is the bridge from documentation (docs 01–49) to actual code. Per the project brief's implementation rules: work proceeds in small milestones, each with a goal, file list, tests, documentation, and acceptance criteria; one milestone finishes and is verified before the next begins.

Rather than speculatively writing out hundreds of fully-detailed milestones now (most of which would need revision once earlier milestones surface real decisions), this doc defines the **template**, fully details the **first few milestones** as a concrete example of the standard, and lists the **planned milestone sequence for Phase 1** at a lighter level of detail — each gets fully fleshed out (per the template) immediately before it's started, and logged in a running `MILESTONES.md` at the repo root as work proceeds.

## Milestone Template
```
### M<n> — <short title>
Goal: <one sentence, what a user/system can do after this milestone that they couldn't before>
Requirement IDs: <doc 04 IDs this addresses, e.g. AUTH-1>
Files: <expected new/changed files or modules>
Tests: <what gets tested, referencing doc 38's test types>
Docs: <which of docs 01–49 this milestone should update, if any drift is discovered>
Acceptance criteria: <specific, checkable conditions — not "auth works" but "a new user can
  register with email, receive a verification code, verify it, and reach the empty Following
  feed; an already-registered email returns a clear 409 error; password is stored as an
  argon2id hash, never plaintext, verified by test">
```

## Milestone 0 — Repository & Environment Scaffolding (fully detailed, as the worked example)
- **Goal**: A new engineer can clone the repo, run one command, and have the local dev stack (Postgres, Redis, Elasticsearch, backend API) running, with CI passing on an empty-but-structured codebase.
- **Requirement IDs**: none directly (infrastructure prerequisite for all others).
- **Files**: monorepo scaffold per doc 39 (`apps/`, `packages/`, `infra/`, `.github/workflows/`), `docker-compose.yml` per doc 34, base NestJS app with health-check endpoint, base Expo app shell, base Vite web app shell, shared `eslint-config`/`ui-tokens`/`api-types` packages (empty but wired up).
- **Tests**: CI pipeline (doc 36) runs successfully on this empty scaffold — lint/typecheck/build all pass trivially, proving the pipeline itself works before any real feature code depends on it.
- **Docs**: none updated (this milestone implements docs 34/35/36/39 as written).
- **Acceptance criteria**: `docker compose up` succeeds locally; `GET /health` returns 200; a trivial PR passes all CI checks and can be merged following the branch protection rules in doc 36/41.

## Milestone 1 — User Registration (Email) (fully detailed, as the worked example)
- **Goal**: A new user can register with email + password and reach a verified account.
- **Requirement IDs**: AUTH-1, AUTH-4 (partial — token issuance).
- **Files**: `apps/backend/src/modules/auth/*` (register, verify-email endpoints + DTOs), `users`/`auth_identities` migrations (doc 20), mobile registration screens (doc 08 flow 1, steps 1–3 only — OAuth/username/profile steps are separate milestones below).
- **Tests**: unit (password hashing, DTO validation), integration (real registration → verification flow against ephemeral Postgres), security-specific (password never logged, per doc 31/37's redaction requirement — a test asserting this).
- **Docs**: none expected to change; flag doc 20/22/23 for update if implementation reveals a gap.
- **Acceptance criteria**: matches doc 08 flow 1's edge cases explicitly — duplicate email returns a clear error routing to login, not a generic 500; password hashed via argon2id verified in a test; verification code expires after a defined window and can be resent.

## Phase 1 Milestone Sequence (planned, lighter detail — expanded to full template immediately before each starts)

**Auth & Identity (M1–M8)**
M1 Email registration (detailed above) · M2 Email verification resend/expiry edge cases · M3 Login (email/password) + JWT issuance · M4 Google OAuth · M5 Apple OAuth · M6 Refresh token rotation + reuse detection · M7 Logout + "log out everywhere" · M8 Username selection/uniqueness (doc 08 flow 1 step 4)

**Profile (M9–M14)**
M9 Profile read/update (avatar, bio, cover) · M10 Media upload pre-signed URL flow (doc 30) · M11 Privacy settings (PROF-2) · M12 Public profile view (with block/privacy enforcement, doc 24) · M13 Locale selection + persistence (doc 48) · M14 Empty-state onboarding landing (doc 08 flow 1 step 7)

**Social Graph (M15–M19)**
M15 Follow/unfollow · M16 Friend request send/accept/decline · M17 Block · M18 Mute · M19 Follower/following list views

**Posts & Engagement (M20–M27)**
M20 Create text post · M21 Create photo post (single image) · M22 Photo carousel (multi-image) · M23 Comments · M24 Likes · M25 Bookmarks · M26 Edit/delete own post · M27 Post detail view (web+mobile)

**Feed (M28–M31)**
M28 Following feed (fan-out-on-read, doc 27) · M29 Global feed + basic spam filtering · M30 Feed caching (Redis) · M31 GraphQL feed aggregation query (doc 22/27)

**Messenger — Direct Chat (M32–M40)**
M32 Device key registration (Signal Protocol prekey publishing, doc 26) · M33 X3DH session establishment · M34 WebSocket gateway + Redis pub/sub backplane (doc 18) · M35 Send/receive encrypted message · M36 Delivery/read receipts · M37 Typing indicators · M38 Chat list view + last-message preview · M39 Message history pagination · M40 Push notifications for new messages (doc 25, message-content-redacted)

**Search (M41–M43)**
M41 Elasticsearch indexing pipeline (dual-write, doc 29) · M42 People/post search with Ukrainian analyzer · M43 Unified search UI (doc 09)

**Moderation & Admin — Basic (M44–M48)**
M44 Report submission (MOD-1) · M45 Admin reports queue (basic) · M46 User suspend/ban (admin action, doc 24 audit-logged) · M47 Admin user search/management · M48 Announcement banner (basic)

**Cross-Cutting Hardening (M49–M52, run alongside/after the above as needed)**
M49 Accessibility pass on all Phase 1 screens (doc 47) · M50 Performance validation against doc 05 targets on reference device (doc 46) · M51 Full i18n QA pass (uk/en, doc 48) · M52 Security review + pen-test pass before Phase 1 launch (doc 31)

This sequence is **not strictly linear** — e.g. the Messenger milestones (M32–M40) can start once Auth/Profile/Graph are stable, in parallel with later Post/Feed milestones, if team capacity allows; the numbering here reflects logical dependency order, not a mandated single-threaded execution order.

## Beyond Phase 1
Phase 2/3/4 milestone sequences (Communities, Stories, Group Chat/Channels, Calls, Recommendation Engine, AI Moderation, full Admin Panel, 2FA/Passkeys) are deliberately **not** enumerated here — per doc 03's own reasoning, detailing them now would be speculative work built on a Phase 1 that hasn't yet surfaced its real lessons. Each phase's milestone sequence gets written, in this same format, at that phase's kickoff.

## How This Doc Is Used Going Forward
`MILESTONES.md` at the repo root (created in Milestone 0) tracks actual status (not started / in progress / done / blocked) against this planned sequence, updated as each milestone completes — this document (doc 50) is the plan; `MILESTONES.md` is the live log. Discrepancies between the two (a milestone that turned out differently than planned) are reconciled by updating this doc, not by letting the two silently diverge.

---

## End of Documentation Phase

Docs 01–50 are complete. Per the project brief's own rules, no more documentation is produced speculatively ahead of need — from here, work proceeds milestone by milestone starting with M0, each one built, tested, and reviewed before the next begins.
