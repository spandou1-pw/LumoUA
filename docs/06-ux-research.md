# 06 — UX Research

Status: DRAFT — this is a structured placeholder for real qualitative/quantitative research (interviews, surveys). No synthetic user quotes or fabricated data points are included, per project rules against fake data. What follows is the research *plan* plus reasoned assumptions the team is proceeding on, clearly marked as assumptions, not findings.

## Research Questions (to validate with real users before Phase 2 lock-in)
1. Do Ukrainian users actually want a single app to replace their Telegram channel + Instagram profile, or do they treat those as serving different social needs that shouldn't merge?
2. How much do users trust a new platform with E2E-encrypted messaging versus staying on Telegram out of habit/network effects?
3. What specifically frustrates current Telegram/Instagram users that a new entrant could fix (moderation quality, ads, algorithm, Ukrainian-language support)?
4. Is "no Russian localization" a meaningful draw for the target audience, neutral, or does it reduce reach (e.g. Russian-speaking Ukrainians who don't use Ukrainian-language UI)?

## Planned Methods
- 15–20 semi-structured interviews with a mix of: general consumer users, community/channel admins currently on Telegram, small business/creator accounts currently on Instagram.
- Survey (quant) to validate interview themes at larger sample size, distributed via Ukrainian social channels.
- Competitive teardown (see below) as a starting frame, not a substitute for user input.

## Competitive Teardown (analytical, not user research — informs hypotheses only)
| Product | Strength to match/exceed | Weakness to exploit |
|---|---|---|
| Telegram | Speed, channels, low-friction sharing | No native "feed" identity layer; monetization/ownership concerns for some users; heavier tooling (bots/MTProto) is overkill for average user |
| Instagram | Visual feed, Stories UX polish | Algorithm optimized for engagement over relevance; weak/absent Ukrainian-specific moderation; ads |
| Facebook Groups | Community/event tooling | Perceived as declining/legacy among younger Ukrainian users |

## Working Assumptions (to be validated, not treated as fact)
- A1: Community/channel admins are a high-leverage early adopter segment — if they migrate their primary channel, their audience follows. Prioritize their needs (moderation tools, analytics) even in early phases.
- A2: Users will not migrate primary messaging habits without a clear trust signal on encryption/privacy — onboarding must make E2E encryption legible, not just present.
- A3: "No Russian localization" is a values statement more than a growth lever; it should not be marketed as a headline feature but reflected quietly in product behavior.

## Immediate Next Step
Before Phase 1 UI is finalized, run at least the interview round above with real participants. Doc 07 (Personas) and doc 08 (User Flows) below are built from the working assumptions and competitive analysis, and are marked as **hypothesis-driven drafts** — they should be revised once real interviews happen.
