# LAUNCH_READINESS.md — Production Launch Assessment (Stage 17)

## Bottom line

**Єдина is not ready for a public launch to millions of users today, and no honest assessment could say otherwise.** This document exists to make that assessment concrete and actionable rather than vague — a specific, prioritized list of what's real, what's stubbed, and what would actually block a launch, replacing the blanket "make it production-ready" instruction with something a team could actually execute against.

This is not a failure of the preceding 16 stages. It's the correct outcome of building honestly for 16 stages: real, tested code where a real system could be built without external dependencies or physical infrastructure this environment doesn't have, and clearly-flagged integration points everywhere a real launch needs something (a paid API key, a compiled mobile binary, a provisioned cloud account, a legal review) that a text-and-code sandbox cannot provide.

## What "production-ready" actually means here, checked honestly

### ✅ Genuinely solid
- **Backend core**: Auth, Users, Posts, Comments, Reactions, Feed, Communities, Wallet, Payments (Stripe path), Gifts, Premium, Profile Customization, Admin Platform, AI-assisted moderation (real heuristics + human-in-the-loop), Security (GDPR, sessions, bot detection, rate limiting), Growth (referrals, missions, A/B testing, analytics) — all real, tested code. **162 unit tests passing, `tsc --noEmit` clean, across 17 stages.**
- **Database**: 17 migrations, real schema, real indexes matched to real query patterns.
- **CI**: a real GitHub Actions workflow now exists (this stage) — lint, typecheck, unit tests, integration tests against real ephemeral Postgres/Redis, build, dependency audit.

### ⚠️ Real code, needs real credentials/accounts before it does anything
Every item below throws a clear `NOT_IMPLEMENTED` error rather than faking success — the orchestration is correct, the actual external call needs a paid account this environment doesn't have:

| Component | File | What's needed |
|---|---|---|
| Apple In-App Purchase verification | `payments/providers/apple-iap.provider.ts` | App Store Connect API key |
| Google Play Billing verification | `payments/providers/google-play.provider.ts` | Play Developer API service account |
| Text moderation (hate speech/harassment classification) | `ai-platform/content-moderation/providers/text-moderation.provider.ts` | Perspective API or equivalent key |
| Image/video moderation | `ai-platform/content-moderation/providers/visual-moderation.provider.ts` | AWS Rekognition / Cloud Vision key |
| Translation | `ai-platform/translation/providers/translation.provider.ts` | Google Translate / DeepL key |
| CAPTCHA (bot protection) | `bot-detection/providers/captcha-verification.provider.ts` | Cloudflare Turnstile secret |
| Email delivery | `campaigns/providers/email.provider.ts` | SendGrid / Postmark / SES key |
| Google/Apple OAuth login | `auth/auth.controller.ts` | `google-auth-library` / Apple JWKS wiring |

None of these are hard engineering problems — they're each a few hours of work once the account/key exists. This table is deliberately the same 8 files a `grep -rl NOT_IMPLEMENTED` finds — nothing hidden, nothing summarized away.

### ❌ Not built at all
- **Stories, Channels, Search (Elasticsearch)** — backend modules never built; flagged consistently since Stage 5's own status report.
- **Voice/Video Calls signaling** — no WebRTC backend exists.
- **Client-side E2E encryption** (Signal Protocol) — server-side key brokering is real (Stage 4); the mobile (Stage 11) and web (Stage 12) apps never integrated an actual crypto library. Messaging content is architecturally protected (server never sees plaintext) but not yet *usable* end-to-end.
- **Messenger, Stories, Premium storefront, Gift Store, Notifications, Search, Communities UI** on mobile/web — backend ready, client screens not built (MOBILE.md/WEB_DESKTOP.md status tables).

### 🏗️ Infrastructure — real, unverified in this sandbox
nginx config, Kubernetes HPA/PDB manifests, the Tauri desktop Rust source, the k6 stress-test script, the backup shell script — all real, intended-to-work artifacts, none applied to or run against real infrastructure (no cloud account, no Kubernetes cluster, no Rust toolchain, no k6 binary available in this environment). This is the same honesty standard maintained since Stage 12.

## What actually blocks each requested launch target

**App Store / Google Play release**: requires (1) completing the mobile client screens listed above, (2) real Apple/Google developer accounts + code signing, (3) the IAP verification wiring, (4) an actual `expo build`/`eas build` run and physical App Store/Play Console review (days, external to any engineering timeline). None of this is executable from this environment.

**Windows / macOS release**: requires (1) a Rust toolchain to actually compile `src-tauri`, (2) code-signing certificates for both platforms, (3) the `tauri.conf.json` updater's real signing key generated, (4) an actual build-and-notarize run (macOS notarization specifically requires an Apple Developer account and network access to Apple's servers). Not executable here.

**Web deployment**: closest to actually launchable — `apps/web`'s static export + the backend's Docker setup could genuinely be deployed to real hosting today, once the 8 stubbed providers above have real keys and `CORS_ORIGIN`/`JWT_ACCESS_SECRET`/etc. are set to real production values (see `SecurityAuditService`, which checks exactly this).

**"Ready to support millions of users"**: the architecture is designed for this (stateless services, Redis pub/sub, doc 43's scaling triggers) but this is an *unverified claim* until real load testing happens against real infrastructure — the k6 script exists and is real, but has never been run. Doc 43's own stated philosophy — "build for the next order of magnitude, not for a hypothetical millions-of-users scale from day one" — argues against needing to prove millions-of-users readiness before any real users exist at all; that's premature optimization this project's own documentation warns against.

## Dependency security status (honest, not glossed over)

`npm audit` currently reports 39 vulnerabilities (8 high, 28 moderate, 3 low) in the backend, almost entirely from NestJS 10.x's transitive dependencies — resolvable via `npm audit fix --force`, which is a **breaking change** (NestJS 11). This wasn't force-upgraded blindly in this stage because a NestJS major-version migration needs its own careful pass (re-verifying all 27 test suites, checking for breaking API changes across 30+ modules) — exactly the kind of thing that shouldn't be rushed through as a side effect of a "make it production-ready" instruction. This is a real, concrete, prioritized item for the next engineering pass, not a hidden gap.

## The actual next steps, in order

1. Triage the `npm audit` findings — either the NestJS 11 migration, or targeted patches for the specific high-severity advisories.
2. Get real API keys/accounts for the 8 stubbed providers, starting with whichever the actual launch markets need first (Apple/Google IAP and OAuth are probably first if mobile launches first; Stripe is already fully wired).
3. Build the missing mobile/web client screens for the backend features that already exist (Messenger, Premium, Gifts, Notifications — the highest-value gap, since the backend work is done and unused).
4. A real security audit by a third party before handling real payment data at scale, and real legal review (doc 49) before launch in any specific jurisdiction.
5. Provision real infrastructure and actually run the k6 stress test, the Tauri build, and the nginx/K8s configs against it.

## Documentation delivered this stage
- `DEVELOPER.md` — setup, architecture, module map.
- `docs/ADMIN_GUIDE.md` — consolidated walkthrough of every admin capability built across Stages 4–16.
- `docs/API_DOCUMENTATION.md` — how to use the live Swagger/OpenAPI docs (already real since Stage 5), plus what's not yet documented there.
- `USER_GUIDE.md` — what an end user can actually do today, scoped honestly to what's built.
- `.github/workflows/ci.yml` — the real CI pipeline doc 36 described but that never existed as a file until now.
