# 01 — Vision

## Working Name
*(placeholder for team decision — e.g. "Гурт", "Коло", "Свої" — to be finalized in Milestone 0)*

## One-Line Vision
A native-quality, Ukrainian-first social platform that combines fast, private messaging with a modern public feed — built for Ukraine's cultural context, language, and creator economy, not as a clone of Telegram or Instagram.

## Why This Exists
Ukrainian users today split their social lives across Telegram (messaging/channels), Instagram (visual feed/stories), and Facebook (community groups) — none of which are built for Ukraine specifically, and all of which have shown willingness to deprioritize Ukrainian-language moderation, ad quality, or data locality concerns. There is room for a platform that:

- Treats Ukrainian as the primary language, not a translation afterthought
- Explicitly excludes Russian localization as a product stance
- Combines messaging + public feed + communities in one coherent product instead of three apps
- Is fast and native-feeling on iOS, Android, and Web from day one

## Who It's For (initial focus)
- Ukrainian users inside Ukraine and in the diaspora
- Communities, creators, and small businesses who currently juggle a Telegram channel + Instagram page + Facebook group for the same audience

## Product Pillars
1. **Speed & polish** — native-feeling animations, instant perceived load, works well on average Android hardware and imperfect connectivity.
2. **Messaging-first trust** — E2E-encrypted private messaging is a core primitive, not a bolted-on feature.
3. **One coherent identity** — a single profile that carries across chats, feed, and communities (unlike Telegram's channel/chat split).
4. **Ukrainian-language quality** — moderation, search, and recommendations tuned for Ukrainian morphology and slang, not just machine-translated English tooling.
5. **Sustainable, not extractive** — recommendation engine optimizes for time-well-spent signals (not pure engagement-maximization) — a concrete, testable design constraint, not a slogan.

## Explicit Non-Goals (v1)
- Not a Russian-market product; no Russian localization.
- Not trying to match Telegram's Bot API / MTProto ecosystem on day one.
- Not building a short-form video competitor to TikTok/Reels as a primary pillar (Stories yes, full short-video feed later).
- Not monetizing via aggressive ad targeting in v1 — monetization model TBD in a separate business doc.

## Success Looks Like (directional, not committed metrics)
- Communities migrate their "primary" channel to the platform, not just a mirror.
- Median message delivery latency and cold-start time competitive with Telegram on mid-range Android devices.
- Ukrainian-language content moderation has measurably lower false-negative/false-positive rates than repurposed English-first moderation tooling.

## Open Questions for Milestone 0
- Final product name & brand identity
- Legal entity / data residency strategy (Ukraine vs EU hosting) — see doc 49 (Legal)
- Monetization strategy (ads / subscriptions / creator payouts) — not specified in original brief, needs a decision before doc 02 can be fully load-bearing on business model
