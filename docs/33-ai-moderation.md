# 33 — AI Moderation

Status: **Phase 3** (per doc 03/04 MOD-4). Documented now, ahead of the build, so Phase 1/2 event-logging and data retention decisions (doc 28's groundwork pattern applies here too) don't foreclose Phase 3 options.

## Scope & Purpose
AI classification exists to **prioritize and assist human review**, not replace it (doc 32's human-in-the-loop principle) — the model's output is a confidence-scored flag that affects queue ordering, never a unilateral removal action, except the narrow legally-mandated exceptions already carved out in doc 32 (which use established third-party hash-matching services, not a custom-trained model, and are a distinct system from what's described below).

## Classification Targets (Phase 3 initial scope)
- Spam/scam content (link patterns, repetitive posting) — highest-confidence, lowest-harm-if-wrong category, reasonable first target.
- Hate speech / harassment — text classification, Ukrainian-language-specific model or fine-tune (a model trained primarily on English hate-speech datasets performs poorly on Ukrainian slang/context — this is a direct product-quality requirement from doc 01's Pillar 4, not just a nice-to-have).
- Graphic violence / NSFW imagery — image classification, likely via an established third-party content-safety API/model rather than training from scratch, given the scale of data and expertise needed to do this well and safely in-house.
- Self-harm content — routed to a **distinct, higher-sensitivity path**: flagged content in this category is prioritized for immediate human review and, where the platform has resources to do so, paired with in-app resources/support information shown to the *posting* user, not just queued for removal-focused moderation. This category is treated differently by design because the appropriate response to self-harm content is often support rather than punitive removal.

## Model Approach
- Prefer established, vetted third-party moderation APIs/models for image/video classification (NSFW, violence) over training from scratch — this is a mature, well-served problem space where building in-house adds risk (data handling, model quality, maintenance burden) without a clear advantage for a platform at this stage.
- Text classification (hate speech/harassment, Ukrainian-specific): a fine-tuned open-source multilingual/Slavic-language model is the realistic Phase 3 starting point over a fully custom-trained model, given team size — revisit building in-house training data and a custom model only once there's enough labeled Ukrainian-specific moderation data (itself a byproduct of Phase 1/2 human moderation decisions, which should be logged with enough structure to become future training data — another concrete reason doc 32's human review decisions should be recorded, not just acted on and discarded).

## False Positive/Negative Handling
- Every AI-flagged item that a human moderator dismisses (false positive) is logged distinctly from a confirmed action — this feedback loop is the mechanism for measuring and improving classifier precision over time, not a one-time launch validation.
- No account-level automated penalty accrues purely from AI flags — penalties (warn/suspend/ban) require the human action step from doc 32's table, so a misfiring classifier can't cascade into user harm without a person confirming it first.

## Transparency
Users whose content is removed following an AI-assisted flag are told the *category* of violation (per doc 32's specificity requirement) — the system does not disclose it was "an AI" specifically vs. human review, since from the user's perspective what matters is the stated reason and their ability to appeal, not the internal mechanism; this avoids both false reassurance ("a human definitely reviewed this personally in real time" isn't always true even in human-in-the-loop systems handling volume) and adversarial gaming of a disclosed detection pipeline.

## Explicit Non-Goals (Phase 3)
- No fully automated ban pipeline.
- No predictive/pre-crime style flagging of users based on inferred future behavior — classification operates on posted content, not on speculative user-risk scoring, which would be a significant overreach relative to the stated moderation purpose.
