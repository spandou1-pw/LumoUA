# 49 — Legal Considerations

**This document is an engineering-level flag list of legal touchpoints identified while writing docs 01–48, not legal advice, and not a substitute for review by a qualified lawyer (Ukrainian and EU data protection/consumer law specifically). Every item below should be treated as "needs real legal review before launch," not as a resolved decision.**

## Data Protection
- **GDPR baseline** adopted as the compliance target given the EU-hosting default (doc 02/05) — applies regardless of whether Ukrainian users are technically inside the EU, since diaspora users and EU-hosted infrastructure both pull it in scope. Needs review: whether Ukraine's own data protection law ("On Personal Data Protection") imposes additional or different obligations for users physically in Ukraine, and how the two regimes interact.
- **Right to erasure** (doc 30/45): the backup-retention-vs-deletion tension flagged in doc 45 needs an explicit, legally-reviewed retention window, not the engineering-proposed default.
- **Data Processing Agreements**: needed with every third-party processor in the stack — Cloudflare (R2/CDN), the managed Postgres/Redis providers, the push notification providers (Apple/Google), any third-party AI moderation API (doc 33), any OAuth providers (Google/Apple) processing user data on the platform's behalf.
- **Breach notification**: the 72-hour GDPR notification requirement (flagged in doc 44) needs a concrete internal process owner and template, reviewed by counsel, before it's needed in a real incident.

## Content & Platform Liability
- **EU Digital Services Act (DSA)**: likely applicable given EU hosting/user base — imposes specific obligations around content moderation transparency, reporting mechanisms (doc 32's reporting flow should be checked against DSA's specific requirements, not just designed against general best practice), and potentially additional obligations if the platform grows past certain user-count thresholds.
- **CSAM reporting obligations** (doc 32): mandatory reporting to relevant authorities (e.g. NCMEC in the US context, or the equivalent EU/Ukrainian mechanism) upon detection — needs a concrete, legally-vetted reporting workflow, not just the engineering-level "auto-flag and escalate" description in doc 32.
- **Terms of Service / Community Guidelines**: referenced implicitly throughout (doc 32's moderation categories, doc 04's feature set) but not drafted as an actual legal document — required before public launch, and the moderation categories/actions in doc 32 should be drafted to match the ToS language exactly, not diverge from it.

## Encryption & Export Controls
- **E2E encryption** (doc 26/31): some jurisdictions regulate or restrict export/use of strong encryption technology. Needs review of whether Signal Protocol's implementation/distribution triggers any export-control classification requirements, particularly if the app is distributed in additional jurisdictions beyond the initial Ukraine/diaspora/EU focus.
- **Lawful access requests**: given true E2E encryption means the platform cannot decrypt message content even under a valid legal request, the legal/policy team needs a clear, defensible position on this (what the platform *can* provide — metadata, account info — vs. what it structurally cannot) before it's tested by a real request, not improvised in the moment.

## Intellectual Property
- **User-generated content licensing**: the ToS needs clear language on what license users grant the platform to display/distribute their content (standard for any UGC platform, but must be drafted, not assumed).
- **Trademark**: "Kolo" is a placeholder codename (doc 02) — real trademark clearance search required before any branding (doc 10) is finalized and publicly used.
- **Third-party fonts** (doc 13): Fixel Display and Golos Text licensing terms need verification for the intended commercial use case (app-embedded font, not just web-embedded) before shipping — font licenses frequently distinguish between these use cases.

## Employment/Contractor (if applicable)
Not covered by this brief's scope, but flagged: if the team includes contractors/agencies producing code or design assets (per the "elite software company" roles in the original brief), IP assignment agreements should be in place so all deliverables are clearly owned by the project/company, not left ambiguous.

## Accessibility Legal Requirements
Beyond doc 47's WCAG-as-best-practice framing: some jurisdictions have legally *mandated* accessibility standards for digital products (e.g. the EU's European Accessibility Act) — needs review of whether/when these become legally binding requirements rather than voluntary best practice for this specific product and its markets.

## Immediate Pre-Launch Legal Checklist (non-exhaustive, for counsel to expand)
1. Terms of Service + Privacy Policy + Community Guidelines drafted and reviewed
2. Data Processing Agreements executed with all processors
3. GDPR/Ukrainian data protection compliance review completed
4. CSAM/illegal-content reporting workflow legally vetted
5. Trademark clearance for final product name
6. Font/asset licensing verified for commercial mobile app use
7. DSA applicability assessment (if launching to EU users)
