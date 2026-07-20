# 45 — Backup Strategy

## Database (Highest Priority — Hardest to Regenerate)
- Continuous WAL (Write-Ahead Log) archiving via the managed Postgres provider (doc 34) — supports the 15-minute RPO target from doc 44 by enabling point-in-time recovery to nearly any moment, not just the last full snapshot.
- Full daily snapshots retained for 30 days, weekly snapshots retained for 6 months, monthly snapshots retained for 2 years — a tiered retention schedule balancing recovery flexibility against storage cost, revisited once real cost/usage data exists rather than treated as permanently fixed.
- Snapshots replicated cross-region (even though live service failover isn't multi-region per doc 44's acknowledged limitation, backup *data* durability is cheap enough to protect against full-region loss independent of that decision).
- Backup restore is tested as part of the DR drill (doc 44) — an untested backup is not a verified backup, stated here as the concrete practice behind that principle.

## Object Storage (Media)
Per doc 30: R2's built-in durability is the primary guarantee for object storage, given S3-class storage's inherent design for high durability. Cross-provider backup (e.g. periodic sync to a second provider) is **not** implemented by default in Phase 1 — flagged as a decision to revisit against real cost data in doc 43's capacity-planning cadence, not assumed necessary preemptively. This is a deliberate, documented risk-acceptance decision, not an oversight: re-derivable/re-uploadable-by-users media loss is a materially different risk category than losing the primary transactional database.

## Elasticsearch
Not backed up independently — the search index is treated as a **derived, rebuildable** data store (doc 29's dual-write approach means it can be fully reconstructed from Postgres) rather than a source of truth requiring its own backup regime. A full reindex procedure (doc 29's blue-green aliasing approach) doubles as the "recovery" path for Elasticsearch data loss.

## Redis
Not backed up — used exclusively for cache (feed cache, doc 27) and ephemeral real-time state (pub/sub, presence), never as a system of record for data that can't be regenerated from Postgres. This is a schema/architecture design constraint stated explicitly here: any future feature proposing to store Redis-only data that *isn't* safely regenerable or cache-only would need to revisit this backup posture, not be added silently.

## Secrets/Configuration
Infrastructure-as-code (doc 35) is itself the backup for configuration — a fresh environment can be reconstructed from Terraform/Helm definitions in version control; secrets specifically are backed up via the secrets manager's own provider-level durability guarantees (doc 35), never backed up to a separate, less-secured location for convenience.

## Backup Access Control
Backup storage access is scoped as narrowly as the production database credentials themselves (doc 31's least-privilege principle) — a backup is, by definition, a full copy of sensitive user data, and treating backup access as a lower-security-tier location than production would undermine the whole security posture built elsewhere in this doc set.

## Legal/Compliance Retention Tension
Backup retention (above) and the "right to erasure" deletion requirement (doc 30/49) are in tension: a user's data deleted from production may still exist in a database snapshot for up to the retention window. This is a known, common tension in GDPR-compliant backup design — addressed via documented retention limits (backups age out and are deleted per the schedule above, so erasure is eventually complete even if not instantaneous) and should be explicitly reviewed in doc 49 with real legal guidance on acceptable backup-retention windows post-deletion-request, not assumed resolved by this engineering-level treatment alone.
