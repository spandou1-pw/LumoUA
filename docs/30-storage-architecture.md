# 30 — Storage Architecture

## Object Storage
Cloudflare R2 as primary (S3-compatible API, zero egress fees — meaningful at social-media media-serving scale), architected against the S3 API surface specifically so AWS S3 remains a drop-in fallback/multi-provider option without an application rewrite, per the brief's "Cloudflare R2 / AWS S3 compatible" requirement.

## Upload Flow
1. Client requests a pre-signed upload URL from `POST /media/upload-url` (doc 22), scoped to a specific key prefix/content-type/size limit.
2. Client uploads directly to R2 (not proxied through the NestJS backend) — keeps large binary transfer off the API servers, standard pattern for scalable media handling.
3. On upload completion, client notifies the backend (or a webhook/event from R2 triggers it) to register the asset and, for video, enqueue transcoding (below).
4. Orphaned uploads (client uploaded but never attached to a post, e.g. abandoned compose flow) are cleaned up by a scheduled job checking for unreferenced keys older than 24h.

## Image Pipeline
- On upload, a background job (BullMQ, doc 18) generates: a set of responsive sizes (thumbnail, feed-width, full-res) and a blurhash placeholder string (stored alongside the media record for the progressive-load UX in doc 17).
- Served through Cloudflare's CDN/image resizing at the edge where possible, reducing origin load and giving clients device-appropriate images without pre-generating every possible size combination.

## Video Pipeline (Phase 2, POST-3)
- Upload → BullMQ job triggers transcoding (proposal: Cloudflare Stream, or a self-hosted FFmpeg-based worker if cost/control tradeoffs favor it once real volume is known — this decision is deferred to Phase 2 kickoff, not locked in now, since it depends on volume/cost data this Phase 1-focused document can't yet have).
- Output: adaptive bitrate renditions (HLS/DASH) for smooth playback across network conditions, consistent with the NFR-PERF-4 graceful-degradation requirement.
- Thumbnail extraction (first-frame or a designated timestamp) for feed preview, same blurhash-placeholder pattern as images.

## Storage Key Structure
`{env}/{entity_type}/{entity_id}/{asset_id}.{ext}` (e.g. `prod/posts/9f2.../a31....jpg`) — predictable, avoids key collisions, and makes bulk operations (e.g. GDPR-driven deletion of all assets for a user) tractable via prefix listing rather than requiring a separate asset-location index (though one is still maintained in Postgres/`post_media` for normal query paths — the key structure is a defense-in-depth convenience, not the sole source of truth).

## Avatar/Cover Images
Same pipeline, smaller size variant set, stricter upload size cap and stricter rate limiting (profile image changes are infrequent by nature, so tight limits don't hurt legitimate use and reduce abuse surface).

## Data Deletion & Right to Erasure
Per doc 49 (Legal, GDPR baseline per doc 05's compliance target): account deletion triggers a job that removes all object-storage assets for that user (via the key-prefix structure above) alongside the database soft/hard-delete cascade — specified here as an architectural requirement so it's not an afterthought bolted onto the storage layer after the fact.

## Backup (cross-ref doc 45)
Object storage: R2's built-in durability relied upon as the primary guarantee (S3-class object storage is already highly durable by design); cross-region/cross-provider backup evaluated in doc 45 against real cost data, not assumed necessary by default given R2's durability characteristics. Database backups (the actually critical, harder-to-regenerate data) are covered fully in doc 45, not here.
