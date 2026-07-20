# 07 — User Personas

Status: hypothesis-driven draft (see doc 06). Personas are composites built from the working assumptions and competitive analysis, not real interview data. Names are placeholders for internal team reference only.

## Persona 1 — "Community Admin" (primary early-adopter target)
- Runs a Telegram channel or Instagram community page (news, hobby, local city group, small business) with 500–50,000 followers.
- Needs: reliable broadcast to followers, basic moderation tools, some way to see engagement, low migration friction (import contacts/followers where legally/technically possible).
- Frustrations with status quo: Telegram channels feel disconnected from a "profile" identity; Instagram's algorithm suppresses reach; both platforms' moderation tooling doesn't handle Ukrainian-language spam/abuse well.
- Success for this persona: they can run their community here with equal or better tooling than Telegram, and don't lose reach by switching.

## Persona 2 — "Everyday Social User"
- General consumer, uses Instagram for browsing + Telegram for chatting with friends/family, possibly across the diaspora.
- Needs: fast messaging, ability to share photos/stories with close friends, doesn't want to manage complex settings.
- Frustrations: juggling two apps for what feels like one social life; occasional discomfort with Instagram ad targeting.
- Success: one app covers both messaging and casual feed browsing without feeling like a compromise on either.

## Persona 3 — "Privacy-Conscious User"
- Technically literate, already uses Signal or values E2E encryption explicitly, may be wary of a new platform's security claims.
- Needs: verifiable, legible encryption (not just a marketing claim), granular privacy controls, minimal data collection.
- Frustrations: platforms that claim privacy but bury real controls, or use E2E for chat but not extend that posture elsewhere (e.g. metadata collection).
- Success: this persona becomes an organic advocate if the security posture holds up to scrutiny — they are a credibility signal for persona 2.

## Persona 4 — "Diaspora User"
- Lives outside Ukraine, uses the platform primarily to stay connected with family/friends and Ukrainian news/culture.
- Needs: reliable performance over potentially higher-latency international connections, content that surfaces relevant Ukrainian community/news without needing to know where to look.
- Frustrations: feeling like an afterthought in Ukraine-focused products; language switching friction (may prefer English UI while consuming Ukrainian content).
- Success: full feature parity regardless of network conditions, and Ukrainian content surfaces naturally even with English UI selected.

## Explicit Non-Persona (for scope discipline)
This v1 does not primarily design for: professional/enterprise use cases, anonymous/pseudonymous activist use cases requiring advanced operational security (beyond standard E2E), or advertisers/brands as a primary user type. These may become relevant later but are out of scope for Phase 1–2 design decisions.
