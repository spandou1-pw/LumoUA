# Stage 5 — API Platform: Status

## Cross-cutting platform infrastructure (applies to every domain)
- **OpenAPI/Swagger** — live at `/api/docs`, generated from the same `@ApiTags`/`@ApiOperation` decorators the controllers carry (not a hand-maintained duplicate — doc 22's anti-drift principle).
- **GraphQL** — `@nestjs/graphql` code-first, schema auto-generated to `src/schema.gql`. Used specifically for Feed (doc 22 says GraphQL is for aggregation-heavy reads); REST remains primary elsewhere, per doc 18.
- **Validation** — global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` (doc 31) already existed since Stage 4; unchanged.
- **Error handling** — standard envelope (doc 22) already existed; unchanged.
- **Pagination** — new shared `PaginationQueryDto` / `paginate()` helper (`common/pagination/`) — cursor-based everywhere (doc 22), used by Posts, Comments, Feed.
- **Filtering** — new shared `BaseFilterQueryDto` for consistent `sort`/`q` params across list endpoints.
- **Caching** — Redis-backed `CacheModule`, applied to Feed (30s TTL per doc 27). Not yet applied to other read-heavy endpoints — add per-endpoint as each domain is built out.
- **Rate limiting** — `@nestjs/throttler`, global default tier (300/min) + named tiers (`RateLimitAuth`, `RateLimitGeneral`, `RateLimitPublicRead`) matching doc 22/31. Applied to Posts/Reactions/Comments in this batch; retrofit onto Stage 4 controllers (Auth/Users/Messages/Communities) as a follow-up — they currently only have the global default tier, not the tighter auth-specific one doc 31 specifies.
- **Tests** — `test/unit/` (mocked repositories, doc 38 authorization-focused examples) and `test/integration/` (real Postgres/Redis via the existing docker-compose, doc 38). Two unit specs + one integration spec included as the pattern to replicate per module — not full coverage of every module yet.

## Domain-by-domain status

| # | API | Status | Notes |
|---|---|---|---|
| 1 | Authentication | ✅ Stage 4 | Swagger annotations not yet added — functional, underdocumented in `/api/docs` |
| 2 | Users | ✅ Stage 4 | same |
| 3 | Profiles | ✅ Stage 4 (part of Users) | same |
| 4 | Followers | ✅ Stage 4 (part of Users) | same |
| 5 | Posts | ✅ **This batch** | Full Swagger, pagination, rate limiting |
| 6 | Comments | ✅ **This batch** | Full Swagger, pagination |
| 7 | Reactions | ✅ **This batch** | Full Swagger |
| 8 | Stories | ❌ Not started | Phase 2 per doc 03; schema not yet designed beyond doc 20's forward note |
| 9 | Messenger | ✅ Stage 4 | Swagger not yet added |
| 10 | Channels | ❌ Not started | doc 26: deliberately NOT E2E, reuses a posts-adjacent model — needs its own short design pass, not a copy-paste of Messenger |
| 11 | Communities | ✅ Stage 4 | Swagger not yet added |
| 12 | Notifications | ✅ Stage 4 | Swagger not yet added |
| 13 | Feed | ✅ **This batch** | REST + GraphQL, cached, both call the same `FeedService` |
| 14 | Search | ❌ Not started | Needs Elasticsearch actually stood up (doc 29) — docker-compose already includes it, service/module not built yet |
| 15 | Media | ✅ Stage 4 (Files) | Covers image/video upload+processing; no dedicated "Video API" beyond this — flagging in case a distinct video-specific surface (e.g. transcoding status polling, playback analytics) was intended beyond what Media/Files already covers |
| 16 | Voice Messages | ❌ Not started | Straightforward extension of Media + Messages once prioritized — no new architecture needed |
| 17 | Calls | ❌ Not started | doc 04 CALL, Phase 3 — needs WebRTC signaling design (not just a REST CRUD module) |
| 18 | Premium | ⚠️ Needs a product decision first | See below |
| 19 | Gifts | ⚠️ **Flagged — see below** | |
| 20 | Coins | ⚠️ **Flagged — see below** | |
| 21 | Wallet | ⚠️ **Flagged — see below** | |
| 22 | Payments | ⚠️ **Flagged — see below** | |
| 23 | Achievements | ❌ Not started | No compliance blockers — straightforward whenever prioritized |
| 24 | Profile Customization | ❌ Not started | No compliance blockers — extends the existing Users/Profile module |
| 25 | Admin | 🟡 Partial | Role assignment + audit log exist (Stage 4). Missing: reports queue, user suspend/ban endpoints, platform statistics (doc 04 ADMIN-1..4) |

## Premium / Gifts / Coins / Wallet / Payments — why these aren't built yet

These five were not in docs 01–50 at all — doc 02 scoped monetization as **freemium + subscriptions only**, explicitly **no in-app virtual currency or gifting economy**. Building Coins/Gifts/Wallet now would be a real product-scope change with consequences docs 01–50 haven't priced in:

- **Money transmission**: depending on jurisdiction, holding user balances and enabling transfers (even "coins," if they're redeemable for anything of value) can require a money transmitter license or an e-money license (EU: EMI authorization).
- **PCI-DSS**: touching real card data directly (vs. tokenizing through a PCI-compliant processor like Stripe) puts the whole platform in a much heavier compliance scope.
- **Virtual currency / lootbox-adjacent regulation**: several EU jurisdictions now regulate paid virtual-currency gifting mechanics similarly to gambling if there's any randomness or resale value — "Gifts" bought with "Coins" is exactly the shape that draws this scrutiny.

None of this means "don't build it" — it means **doc 49 (Legal) needs a real update with real counsel before an engineering team writes a Wallet ledger**, the same standard already applied to the rest of this project. What I can do without waiting on that:

- Design the **API contract** (endpoints, DTOs, transaction/ledger state machine) so engineering work isn't blocked once legal sign-off lands — I can do this now if useful.
- Wire the **Payments** module to a licensed PSP (Stripe is the natural fit given the stack) so Єдина never touches raw card data — that part carries much lower risk and could proceed in parallel with the Coins/Wallet/Gifts legal review.

Let me know which of these you'd like next — real financial features, or the next non-monetization domain (Stories/Channels/Search/Calls/Admin).
