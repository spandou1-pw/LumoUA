# 44 — Disaster Recovery

## Objectives
- **RTO (Recovery Time Objective)**: proposal — 4 hours for full service restoration from a total infrastructure loss scenario. This is a proposed target pending real validation via the disaster-recovery drill described below, not a number that's been tested yet at the time of writing.
- **RPO (Recovery Point Objective)**: proposal — 15 minutes of acceptable data loss, driven directly by the database backup frequency in doc 45 (continuous WAL archiving supports a much tighter RPO than periodic snapshots alone would).

These targets are explicitly marked as proposals because committing to hard RTO/RPO numbers before the infrastructure exists and has been drilled against would be a claim doc 34/35 can't yet back up — doc 49's legal review and any SLA commitments to users/partners should reference validated numbers, not these initial planning targets.

## Failure Scenarios & Response

### Database failure/corruption
Managed Postgres (doc 34) provides automated failover to a standby replica for instance-level failures (minutes-scale, provider-handled). For data corruption (application bug writing bad data, not infra failure) — point-in-time recovery via WAL archiving (doc 45) to a timestamp before the corrupting write, restored to a separate instance for verification before cutover, never a blind restore-over-production.

### Full region/provider outage
Given the EU-hosting default (doc 02) without a committed multi-region active-active architecture (doc 43 deliberately defers this), a full regional outage means genuine downtime until the provider recovers or a cold-standby region is manually activated. Cross-region backup replication (doc 45) ensures data isn't lost even in this scenario, but service availability during the outage window is not currently designed to survive it — this is a explicit, acknowledged current limitation, not an oversight, and the tradeoff (cost/complexity of multi-region vs. current-stage risk tolerance) should be revisited as the platform matures past early growth stage.

### Compromised credentials/security incident
Immediate: rotate all potentially-exposed secrets (doc 31/35), invalidate all active sessions if auth infrastructure itself is suspected compromised (doc 23's "log out everywhere" mechanism, applied platform-wide via an admin tool, not just per-user), assess scope via audit logs (doc 24). Follow-up: the responsible-disclosure/incident-response process from doc 31, including user notification obligations under GDPR (72-hour breach notification requirement, per the EU-hosting compliance posture in doc 05) — reviewed with real legal counsel per doc 49, not just engineering judgment.

### Accidental data deletion (application bug or human error)
Soft-delete-by-default schema design (doc 20) already protects against most accidental content loss for a defined retention window; for genuine hard-delete scenarios (e.g. a botched migration), point-in-time recovery per the database-corruption path above.

## Disaster Recovery Drills
A DR drill (actually restoring from backup to a scratch environment, actually testing the failover path) should be run before public launch and on a recurring cadence (proposal: every 6 months) thereafter — untested backups/DR procedures are a well-known way for an organization to discover its DR plan doesn't actually work at the worst possible moment; this is called out explicitly as a required practice, not just a document that gets written and never exercised.

## Communication Plan
A status page (even a simple one) and a defined internal escalation path for who declares an incident, who communicates externally, and who has authority to execute rollback/DR procedures — specified so that during an actual incident, time isn't lost figuring out roles under pressure.
