# 35 — DevOps

## Philosophy
Small-team-appropriate DevOps: favor managed services and well-trodden tooling over bespoke infrastructure automation, so engineering time goes toward product (per the brief's own emphasis on production-readiness within a large scope) rather than infra novelty for its own sake.

## Infrastructure as Code
All infrastructure (Kubernetes manifests/Helm charts, managed database provisioning, DNS/Cloudflare config) defined as code (Terraform for cloud resources, Helm for Kubernetes application deployment) and version-controlled — no manual console-click provisioning of anything that affects production, since undocumented manual changes are a recurring source of "works on staging, breaks in prod" incidents and make disaster recovery (doc 44) unreliable.

## Secrets Management
A dedicated secrets manager (cloud-provider-native, e.g. AWS Secrets Manager / equivalent, matching whichever cloud is finalized for the EU-hosting decision in doc 02) injected into Kubernetes via a secrets-operator pattern, not stored as raw Kubernetes Secrets objects unencrypted at rest — ties to doc 31's secrets requirements.

## Environment Promotion
Code merges to `main` → auto-deploys to `staging` → manual promotion gate (a deliberate human approval step, not fully automatic) → `production`. The manual gate exists specifically because this is a consumer social product where a bad production deploy has real user-facing consequences (data loss, security exposure) that justify the small added friction, versus a purely internal tool where full continuous deployment might be appropriate.

## Monitoring & Alerting Ownership
Prometheus + Grafana (per the brief's stated stack, detailed in doc 37) — alerting rules routed to an on-call rotation once the team is large enough to support one; until then, routed to a shared channel with defined severity levels so critical issues aren't silently missed even without formal on-call.

## Cost Management
Given the EU-hosting default (doc 02) and the R2-over-S3 preference (doc 30, zero egress fees), cost monitoring is set up from day one (cloud provider billing alerts at defined thresholds) rather than discovered after the fact — media/CDN egress and Elasticsearch cluster sizing are the most likely early cost drivers for a media-heavy social app and are flagged here for ongoing attention.

## Runbooks
Living documentation (not part of this 50-doc set, but referenced here as a requirement) for common operational tasks: rotating a compromised secret, restoring from backup (doc 45), scaling a specific service under load, handling a moderation-related legal request (ties to doc 49) — created incrementally as the team encounters each scenario for the first time, captured immediately rather than relying on tribal knowledge.
