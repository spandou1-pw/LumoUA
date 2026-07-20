# 31 — Security

Consolidates security requirements referenced throughout Track C into one cross-cutting doc, per the original brief's explicit "Security" doc requirement — this is the canonical source; other docs cross-reference it rather than duplicating detail.

## Cryptography Principles
- **Never roll custom cryptographic primitives.** E2E messaging uses the Signal Protocol via a vetted, audited open-source library implementation (doc 26) — not a homegrown ratchet/cipher construction, regardless of how well-understood the underlying math seems to be. This applies equally to password hashing (argon2id, doc 23), TLS (standard library/provider-managed, never a custom TLS implementation), and any future cryptographic feature.
- All data in transit: TLS 1.3 minimum.
- All data at rest: provider-managed encryption (R2/S3 default encryption, Postgres encryption-at-rest via the hosting provider) plus the additional application-layer E2E encryption specifically for message content (defense in depth — infra-level encryption alone would still leave message content readable by anyone with database access, which the E2E layer specifically prevents).

## Application Security
- Input validation at the API boundary via NestJS's class-validator/DTO pattern on every endpoint — reject malformed/oversized input before it reaches business logic, not just at the database constraint layer.
- Parameterized queries exclusively (TypeORM/Prisma-style query builder or parameterized raw SQL) — no string-concatenated SQL, eliminating SQL injection as a risk category by construction rather than by discipline.
- Output encoding on any user-generated content rendered as HTML (web client) — XSS prevention via React's default escaping plus a strict Content-Security-Policy header, not relying on escaping discipline alone.
- CSRF: mitigated primarily by the auth model (Bearer token in Authorization header for API calls, not cookie-based session auth for state-changing requests) — the refresh-token cookie (doc 23) is `HttpOnly`/`SameSite=Strict` specifically to close the remaining cookie-based CSRF surface.
- Dependency scanning (Dependabot or equivalent) and container image scanning in CI (doc 36) — known-vulnerable dependencies block merge, not just get flagged.

## Rate Limiting & Abuse Prevention
- Redis-backed token-bucket rate limiting, tiered by endpoint sensitivity (doc 22's specific numbers) — auth endpoints tightest, general authenticated API looser, public unauthenticated read endpoints (e.g. public profile view) their own tier to prevent scraping abuse without blocking legitimate use.
- CAPTCHA or equivalent (e.g. Cloudflare Turnstile) on registration if bot-driven fake-account creation becomes an observed problem — not built preemptively in Phase 1 without evidence it's needed, but flagged as the first lever to pull if it is.

## Secrets Management
- No secrets in source control, ever — environment-injected via the deployment platform's secrets manager (specific tool chosen in doc 34/35), `.env.example` files in the repo contain only placeholder keys, never real values, including in local development documentation.
- Database credentials, JWT signing keys, OAuth client secrets, and object storage keys all rotated on a defined schedule (specifics in doc 35, DevOps) and immediately on any suspected compromise.

## Infrastructure Security
- Network segmentation: database and Redis not publicly reachable, only from within the application's private network (VPC or equivalent) — enforced at the infra level (doc 34), not just application-level auth.
- Principle of least privilege for all service credentials (e.g. the media-upload pre-signing credential is scoped narrowly, not a full-account object storage key).
- Kubernetes-specific: pod security standards enforced (no privileged containers, read-only root filesystem where feasible), network policies restricting inter-service traffic to only the paths that legitimately need it.

## Vulnerability Response
A documented (even if lightweight, given team size) responsible-disclosure process — a `security.txt`/contact address for external researchers to report issues, and an internal severity-triage process, established before public launch, not after a first incident forces one into existence reactively.

## Privacy-Specific Security Notes
- Message content: never logged, never included in error-tracking/crash-report payloads (a real, easy-to-miss leak vector — application logging middleware must explicitly redact `ciphertext`/message-body fields even though they're already encrypted, as defense against accidentally logging *decrypted* content client-side in debug builds).
- Admin panel access itself is logged (doc 24's audit log) and should itself be protected by stronger auth requirements (2FA required for `admin`/`moderator` roles specifically, ahead of the general Phase 4 2FA rollout — admin accounts are a higher-value target and shouldn't wait for the general feature timeline).

## Cross-References
This doc sets requirements; enforcement mechanics live in doc 36 (CI/CD — scanning/gating), doc 34/35 (Deployment/DevOps — infra-level controls), doc 44/45 (Disaster Recovery/Backup — incident response and data durability).
