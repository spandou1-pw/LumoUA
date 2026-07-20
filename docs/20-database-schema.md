# 20 — Database Schema

Scope: Phase 1 tables only (per doc 03 phasing) — Phase 2+ tables (communities, stories, group chats) are appended to this doc when their phase begins, following the same pattern as doc 15. PostgreSQL, UUID primary keys throughout (`gen_random_uuid()`), `created_at`/`updated_at` timestamptz on every table, soft-delete via `deleted_at` nullable timestamp where user-facing undo/moderation-audit matters (posts, comments) rather than hard delete, hard delete for genuinely ephemeral/sensitive data (message plaintext never touches the DB at all — see doc 26).

## Core Tables (Phase 1)

```sql
users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username          CITEXT UNIQUE NOT NULL,
  email             CITEXT UNIQUE,                 -- nullable: OAuth-only accounts may not expose email
  password_hash     TEXT,                          -- nullable: OAuth-only accounts
  display_name      TEXT NOT NULL,
  avatar_url        TEXT,
  cover_url         TEXT,
  bio               TEXT,
  locale            TEXT NOT NULL DEFAULT 'uk',     -- 'uk' | 'en', per doc 08 onboarding
  is_private        BOOLEAN NOT NULL DEFAULT false, -- PROF-2
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  status            TEXT NOT NULL DEFAULT 'active', -- active | suspended | banned
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)

auth_identities (                                   -- one row per login method
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,                  -- 'email' | 'google' | 'apple'
  provider_uid      TEXT,                            -- OAuth subject id, null for email
  UNIQUE (provider, provider_uid)
)

follows (
  follower_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
)

friend_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
)

blocks (
  blocker_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
)

mutes (
  muter_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (muter_id, muted_id)
)

posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body              TEXT,
  visibility        TEXT NOT NULL DEFAULT 'default', -- 'default' (follows PROF-2) | 'public' | 'followers'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
)

post_media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_type        TEXT NOT NULL,                  -- 'image' | 'video' (video = Phase 2)
  storage_key       TEXT NOT NULL,                  -- R2/S3 object key, doc 30
  position           SMALLINT NOT NULL DEFAULT 0,    -- carousel order
  width             INT, height INT
)

comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body              TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
)

likes (
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type       TEXT NOT NULL,                  -- 'post' | 'comment'
  target_id         UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
)

bookmarks (
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
)

conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL DEFAULT 'direct',  -- 'direct' (Phase 1) | 'group' | 'channel' (Phase 2)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)

conversation_participants (
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'member',  -- member | admin (group/channel, Phase 2)
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at      TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
)

messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES users(id),
  ciphertext        BYTEA NOT NULL,                  -- E2E encrypted payload; server never sees plaintext (doc 26/31)
  ciphertext_meta    JSONB NOT NULL,                  -- protocol/ratchet metadata needed for decryption, non-sensitive
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ                       -- "delete for everyone"; "delete for me" handled client-side/per-participant table if needed
)

device_keys (                                         -- Signal Protocol key material, doc 26
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id         TEXT NOT NULL,
  identity_key      BYTEA NOT NULL,
  signed_prekey     BYTEA NOT NULL,
  one_time_prekeys  JSONB NOT NULL,                   -- pool of unused one-time prekeys
  UNIQUE (user_id, device_id)
)

reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES users(id),
  target_type       TEXT NOT NULL,                    -- 'post' | 'comment' | 'user' | 'message'
  target_id         UUID NOT NULL,
  reason            TEXT NOT NULL,
  detail            TEXT,
  status            TEXT NOT NULL DEFAULT 'open',      -- open | dismissed | actioned
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID REFERENCES users(id)
)

admin_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id          UUID NOT NULL REFERENCES users(id),
  action            TEXT NOT NULL,
  target_type       TEXT,
  target_id         UUID,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

## Design Notes
- `likes` and `bookmarks` use a `target_type`/`target_id` polymorphic pattern deliberately scoped to just two-three target types — this pattern is avoided more broadly in the schema (e.g. `reports` also uses it, kept intentional and small) since over-using polymorphic associations loses referential integrity guarantees Postgres foreign keys would otherwise give us.
- `messages.ciphertext` is `BYTEA`, never `TEXT` with any expectation of readability — reinforced at the schema level that this column is opaque to the application layer beyond routing.
- Indexes (not exhaustively listed here, full index plan in the migration files): `posts(author_id, created_at DESC)` for profile timelines, `follows(followee_id)` for follower-feed fan-out queries, `messages(conversation_id, created_at DESC)` for chat pagination, `reports(status, created_at)` for the moderation queue.
- All Phase 1 tables above map directly to functional requirement IDs from doc 04 — traceability maintained so schema changes can be checked against the requirements doc during review.
