# 24 — Authorization

## Model
Role-based at the platform level (`user`, `moderator`, `admin`), combined with resource-level ownership/relationship checks for everything else — full RBAC-with-custom-permission-matrix is unnecessary complexity for this scope; most authorization decisions in a social app are "is this yours," "are you connected to this person," or "are you staff," not a general permissions engine.

## Platform Roles
- `user` — default.
- `moderator` — can access `/admin/reports`, resolve reports, cannot manage user status/bans (limits blast radius of a compromised or malicious moderator account) or view full admin statistics.
- `admin` — full admin panel access including user status changes and platform statistics.
Role stored on `users.role` (schema addition to doc 20 — noted here since it wasn't in the Phase 1 table list explicitly; added as part of this doc's implementation).

## Resource-Level Rules (representative, not exhaustive — enforced via NestJS guards per-endpoint)
| Resource | Rule |
|---|---|
| Edit/delete post | `author_id == requester.id` |
| Edit/delete comment | `author_id == requester.id` OR requester is `moderator`/`admin` (moderation removal) |
| View private profile's posts | requester is an accepted friend/follower of the profile, OR requester is the profile owner |
| Send message to user | recipient's privacy setting (PROF-2) allows messages from requester's relationship tier, AND neither party has blocked the other |
| View conversation | requester is a `conversation_participants` row for that conversation — checked on every message fetch and WebSocket room join, not just on conversation creation |
| Resolve report | requester role is `moderator` or `admin` |
| Change user status (suspend/ban) | requester role is `admin` only |

## Enforcement Pattern
NestJS Guards + decorators (`@Roles('admin')`, `@RequiresOwnership('post')`) applied at the controller/resolver level, backed by a shared policy-check service so the same ownership/relationship logic isn't reimplemented per-endpoint (a common source of authorization bugs — one endpoint gets the block-check right, another forgets it). GraphQL resolvers use field-level guards for the same policies where a single query aggregates multiple resource types (e.g. the feed query must apply per-post visibility checks per item, not just a query-level gate).

## Privacy Settings as Authorization Inputs
`PROF-2` privacy settings (who can message me, who can see my posts) are not just UI toggles — they are authorization policy inputs evaluated server-side on every relevant read/write, never trusted from client-side filtering alone. This is stated explicitly because it's an easy category of bug to introduce (client hides a "Message" button but the API endpoint doesn't independently check the setting).

## Admin Audit Trail
Every `moderator`/`admin` action (report resolution, user status change, announcement post) writes to `admin_audit_log` (doc 20) — who did what, when, to what target. Not optional/toggleable; this is a standing security and accountability requirement (NFR-SEC-4), reviewable by admins investigating a moderation dispute.

## Future: Community Roles (Phase 2)
Communities (COMM-1..3) introduce a second, scoped role layer (community moderator ≠ platform moderator) — specified when doc 20's schema gains community tables, not designed speculatively here, but flagged now so the authorization service is built with a scoped-role extension point rather than assuming platform roles are the only role dimension that will ever exist.
