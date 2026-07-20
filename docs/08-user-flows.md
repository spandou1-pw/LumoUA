# 08 — User Flows

Scope: core Phase 1 flows only, traced against personas in doc 07 and requirements in doc 04. Each flow lists steps, decision points, and edge cases QA will need to cover (doc 38).

## Flow 1 — Onboarding & First Session (AUTH-1..4, PROF-1)
1. Landing screen: Continue with Email / Google / Apple (AUTH-1/2/3).
2. Email path → enter email → verification code sent → code entered → password set.
3. OAuth path → provider consent → account created automatically with provider-supplied name/avatar.
4. Username selection (uniqueness checked live).
5. Minimal profile setup: avatar (optional, skippable), bio (optional, skippable) — do not block activation on optional fields.
6. Language selection: Ukrainian (default, pre-selected) or English — explicit, not inferred silently, since diaspora users (Persona 4) may want English UI with Ukrainian content.
7. Land on empty Following feed with a clear empty-state prompting to find people/communities (not a dead end).

**Edge cases:** email already registered → route to login, not silent failure. OAuth email collision with existing email-based account → require account linking confirmation, not silent merge (security-sensitive; do not auto-merge accounts).

## Flow 2 — Send First Message (MSG-1)
1. From a profile or search result → "Message" button (respects PROF-2 privacy setting — if recipient restricts who can message them, show appropriate disabled state, not a broken button).
2. New chat opens, E2E session establishes (X3DH handshake) transparently — user should not need to understand key exchange to proceed.
3. Compose and send text; optimistic UI shows "sending" → "sent" → "delivered" → "read" states (NFR-PERF-4).
4. Recipient receives push notification (NOTIF-1) respecting their notification settings.

**Edge cases:** recipient has blocked sender (GRAPH-3) → sender should get a clear, non-punitive-sounding failure state, not a silent hang. Network drop mid-send → message queues locally and retries, visible to user.

## Flow 3 — Create a Post (POST-1, POST-2)
1. Compose entry point (feed FAB or tab).
2. Choose text-only or add photo(s) (up to carousel limit).
3. Optional: tag privacy scope for this post if account allows per-post visibility (defer to PROF-2 default if not overridden).
4. Preview → Post.
5. Appears immediately in own profile and in followers' Following feed (FEED-1) with optimistic local render before server confirms.

**Edge cases:** upload failure on one image in a multi-image carousel → don't discard the whole post; allow retry per-asset.

## Flow 4 — Follow a Community Admin / Migrate a Channel (GRAPH-1, tied to Persona 1)
1. Admin creates account, sets up profile as the "public face" of their community/channel.
2. Admin shares a profile link (with any existing channel promotion) driving followers to follow on the new platform.
3. New followers land directly on the admin's profile with a clear "Follow" CTA and a preview of recent posts, so the value is visible before committing.

**Edge case / research flag:** Phase 1 has no bulk-import of existing Telegram channel followers (no such API exists safely/ethically) — admins must actively drive migration. This is a real adoption risk flagged for the growth/marketing track, not solvable purely in UX.

## Flow 5 — Report Content (MOD-1)
1. Long-press / overflow menu on post, comment, message, or profile → Report.
2. Reason selection (structured categories, not free text only, to make moderation triage tractable).
3. Optional free-text detail.
4. Confirmation state — user should know the report was received, without exposing what happens next (avoid over-promising specific moderation outcomes/timelines).

## Cross-Flow Principle
Every flow above must degrade gracefully offline or on poor connectivity (NFR-PERF-4) — this is called out per-flow above rather than as a generic footnote, since "graceful offline behavior" means something different for sending a message (queue+retry) versus creating a post (local draft persistence) versus reporting content (should probably just require connectivity, given the low frequency and moderation-integrity implications of an offline-queued report).
