# 32 — Moderation

## Principles
Human-in-the-loop by default (doc 04 MOD-4) — automated systems flag and prioritize, they don't unilaterally remove content or ban accounts in v1, except for the narrow, high-confidence categories listed below. This is a deliberate stance: false positives in aggressive auto-moderation erode trust (directly undercuts Persona 3/doc 06's trust goals) faster than slightly slower human review costs the platform.

## Moderation Tiers
1. **User reporting** (MOD-1) — any post/comment/profile/message can be reported (doc 08 flow 5), structured reason categories (e.g. spam, harassment, hate speech, illegal content, impersonation, self-harm content) + optional free text.
2. **Rule-based spam detection** (MOD-3, Phase 2) — rate-limit-based heuristics (e.g. identical content posted rapidly across many accounts, new-account link-spam patterns) auto-flag to the queue, don't auto-remove except see exception below.
3. **AI-assisted classification** (MOD-4, Phase 3, doc 33) — flags for review, prioritizes queue order by confidence/severity, does not auto-remove except see exception below.
4. **Human moderator/admin review** — the `moderator`/`admin` roles (doc 24) triage the queue and take action: dismiss, warn, remove content, suspend, ban.

## Exception: Auto-Removal Without Human Review
Reserved for a narrow, explicitly enumerated category: content matching known CSAM hash-databases (PhotoDNA/equivalent, mandatory legal reporting obligation regardless of platform moderation philosophy — this is a legal requirement, not a product choice, and is out of scope for "human-in-the-loop by default" since there is no legitimate review step for confirmed matches) and content that is an active, credible, specific threat of violence (auto-flagged for *immediate* priority human review with law-enforcement escalation procedures, not auto-removed without review, since false positives on violence-threat classifiers are common and the consequence of an incorrect ban is more socially costly than a few hours' review delay). Both exceptions are elaborated with real legal grounding in doc 49, not finalized purely as an engineering decision here.

## Report Queue & SLA
- Prioritization: severity category (self-harm/violence/CSAM-adjacent reports surface first, regardless of report volume) > report count > age.
- Target response time: not committed publicly as a hard SLA in v1 (team size doesn't support guaranteeing one yet) — but internally tracked as a metric from day one so a real SLA can be set once there's data, per doc 37 (Monitoring).

## Actions Available to Moderators/Admins
| Action | Role | Effect |
|---|---|---|
| Dismiss report | moderator+ | Report marked resolved, no action taken, logged (doc 24 audit) |
| Remove content | moderator+ | Post/comment soft-deleted, author notified with the specific rule violated (not a vague "violated our policies" message — specificity matters for both fairness and appeal-ability) |
| Warn user | moderator+ | Formal warning recorded against account, visible to user |
| Suspend account | admin only | Temporary loss of posting/messaging ability, duration set by admin |
| Ban account | admin only | Full account deactivation |

## Appeals
Every moderation action that affects a user (content removal, warning, suspension, ban) generates a notification with a path to appeal — a minimal Phase 1 appeal is a support-email/form-based process (not a full in-app appeals workflow, which is a larger build deferred unless volume demands it), routed to a `moderator`/`admin` who was **not** the original actioning party where team size allows it.

## Community Moderation (Phase 2, COMM-2)
Community moderators (a role scoped to their community, per doc 24's flagged extension point) can remove content and manage membership within their community only — platform-level moderation (suspend/ban) remains exclusively a platform `admin` action; community moderators cannot affect a user's platform-wide standing, only their standing within that specific community.
