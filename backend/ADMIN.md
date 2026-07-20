# ADMIN.md — Admin Platform (Stage 13)

## What already existed vs. what's genuinely new this stage

Admin functionality has accreted one domain at a time since Stage 4 — every payments/gifts/wallet/premium/profile-customization stage added its own admin controller as it went. Re-auditing against this stage's module list before building anything:

| Module | Status before this stage | This stage |
|---|---|---|
| Premium | ✅ `PremiumAdminController` (Stage 7) — cosmetics/asset-pack CRUD, analytics | Unchanged |
| Coins | ✅ `WalletAdminController` (Stage 9) — lock/unlock, adjustments, fraud queue, analytics | Unchanged |
| Payments | ✅ `AdminPaymentsController` (Stage 6) — purchases, refunds, revenue analytics | Unchanged |
| Gift Store / Gift Collections | ✅ `GiftAdminController` (Stage 8) — catalog/category CRUD, hide/unhide, analytics | Unchanged |
| Users | ❌ Flagged "missing" since Stage 5's own status report | **Built**: `UsersAdminController` |
| Posts | 🟡 Author-only soft-delete existed; no moderator path | **Built**: `PostsService.moderatorRemove` |
| Communities | 🟡 Internal community moderation existed (Stage 4); no platform-level oversight | **Built**: `CommunitiesAdminController` |
| Reports | ❌ Documented in doc 32 since the very first documentation pass, **never implemented in code until now** | **Built**: full `moderation` module |
| Moderation | 🟡 Gift-hide only (Stage 8) | **Built**: general report queue + content removal, tied together |
| Analytics | 🟡 Per-domain only, no cross-domain view | **Built**: `DashboardService` composes the existing per-domain services |
| Feature Flags | ❌ Referenced conceptually since Stage 18/42, never built | **Built**: full module with deterministic rollout |
| Audit Logs | 🟡 The table existed and was written to since Stage 4; nothing ever read it back | **Built**: `AuditLogController` |
| Configuration | ❌ Not built | **Built**: generic key-value `ConfigurationService` |
| Push Notifications (admin) | 🟡 User-triggered notifications existed; no admin broadcast | **Built**: `AnnouncementsService` + batched background fan-out |
| System Health | 🟡 Trivial `/health` endpoint existed (Stage 4 M0); no real connectivity checks | **Built**: `SystemHealthController` — real DB/Redis round trips |
| Security | 🟡 User's own "log out everywhere" existed (doc 23); no admin-triggered version | **Built**: `SecurityAdminController.forceLogout` |
| Dashboard | ❌ Not built | **Built**: `DashboardService` |
| Stories | ❌ Backend Stories still doesn't exist at all | Still not built — nothing for an admin module to manage |

## Messenger — an architectural boundary, not a gap

Messenger is in the requested module list, but there is **no admin message-content viewing capability, and there will not be one** — this is doc 26/31's core guarantee (Signal Protocol E2E encryption; the server never has plaintext access), not an oversight to fix later. What an admin *can* do regarding messages:

- See report metadata for a reported message (who reported it, when, the reporter's own `detail` text — which might include a description or a screenshot reference the reporter provides, since only the reporter and recipient ever see the decrypted content).
- See conversation metadata (participants, message counts, timestamps) via the existing `conversations`/`messages` tables — none of which includes `ciphertext`.
- Take account-level action (suspend/ban the sender) based on a pattern of reports, without ever decrypting a single message.

This is why `ModerationActionsService.removeContent` explicitly does not support `targetType: 'message'` — there is no content to remove server-side (the sender's own client would need to do a "delete for everyone," a user action, not an admin one). A report against a message can be resolved (dismissed or actioned-against-the-account), but never "actioned-by-deleting-the-message-content" the way a post or comment report can.

## Reports/Moderation — the centerpiece of this stage

`Report` (doc 32, coded for the first time): structured reason categories, severity-first queue prioritization (self-harm/illegal-content surface regardless of report volume, matching doc 32's stated priority order exactly), grouped-by-target aggregation (doc 32: "multiple reports on same item, aggregate rather than list duplicates").

`ModerationActionsService.removeContent`: the piece that makes resolving a report *do* something — ties a report's target/reason to real content removal (`PostsService.moderatorRemove`, reusing `CommentsService.remove`'s existing moderator-role branch from Stage 5) and notifies the content's author with the *specific* reason, per doc 32's explicit "not a vague 'violated our policies' message" requirement.

~~One honest gap: `CommentsService.remove()` doesn't currently return the comment's author id, so comment-removal notifications are skipped for now~~ — **fixed in a follow-up pass**: `CommentsService.remove()` now returns `{ authorId }`, and `ModerationActionsService` wires it into the same notification path posts already used. Both post and comment moderation removals now notify the author with the specific reason.

## Feature Flags — deterministic, not re-randomized

`FeatureFlagsService.isEnabledForUser` hashes `userId + flagKey` and buckets it against `rolloutPercentage` — the same user always lands on the same side of a partial rollout across requests, rather than flickering on/off. Tested explicitly (`feature-flags.service.spec.ts`'s "different users can land on different sides" + "is deterministic" pair) — both properties matter and neither is obvious from reading the implementation alone, which is exactly why they're both covered.

## System Health — real checks, not decoration

`SystemHealthController` does an actual `SELECT 1` against the live Postgres connection and an actual set/get/delete round trip against Redis — never a hardcoded `{ status: 'ok' }`. A health check that can't fail is worse than no health check, since it actively hides real outages from whoever's monitoring it.

## Dashboard — composition, not new analytics

`DashboardService` has no analytics logic of its own — it calls `PaymentAnalyticsService`, `WalletAnalyticsService`, `GiftAnalyticsService`, and `ReportsService`, all built in earlier stages, and assembles their outputs into one overview response. This mirrors Stage 10's `ProfileCustomizationService` pattern deliberately: an aggregator that owns no business rules, only composition, so there's exactly one place each underlying metric is actually computed.

## Role split, consistently applied

Every new admin surface follows the same `moderator` vs `admin` split established in doc 24 and already used by every prior admin controller: moderators can *see* and *triage* (view users, view reports, resolve reports, view communities) but only admins can change platform-level standing (suspend/ban a user, deactivate a community, force-logout, change configuration, manage feature flags, send announcements). No new surface introduces a new permission model — they all reuse `RolesGuard`/`@Roles()` exactly as it's worked since Stage 4.

## Testing

- `reports.service.spec.ts` — report filing, not-found handling, resolution (status/audit-log/timestamps), and the severity-ordering query construction.
- `feature-flags.service.spec.ts` — unknown-flag-defaults-to-false (never throws), disabled-overrides-rollout, 100%/0% edge cases, determinism across repeated checks, and real distribution across users at a partial rollout.
- **Not yet covered**: `ModerationActionsService`, `DashboardService`, `SystemHealthController`, and `AnnouncementsService`/its processor don't have dedicated unit tests yet — each composes already-tested lower-level services/repositories, which somewhat reduces the marginal risk, but integration-level coverage (matching the pattern in `test/integration/`) is a reasonable next addition, particularly for the announcement broadcast fan-out given its batch-processing failure modes.

## Explicitly not built

- Stories admin — no backend Stories module exists yet to administer.
- Any message-content moderation capability — architectural boundary, not a gap (see above).
- Automated feature-flag-driven canary analysis or flag-change rollback — flags are a manual on/off/percentage tool here, not a full experimentation platform.
- A visual admin dashboard UI — every admin surface across Stages 6-13 is API-only; a frontend is separate work, same standing note as PAYMENTS.md/GIFTS.md/COINS.md.
