# 21 — ER Diagrams

Mermaid ER diagram for the Phase 1 schema (doc 20). Renders in any Mermaid-compatible viewer (GitHub, most doc tooling).

```mermaid
erDiagram
    USERS ||--o{ AUTH_IDENTITIES : "has"
    USERS ||--o{ POSTS : "authors"
    USERS ||--o{ COMMENTS : "authors"
    USERS ||--o{ FOLLOWS : "follower"
    USERS ||--o{ FOLLOWS : "followee"
    USERS ||--o{ BLOCKS : "blocker"
    USERS ||--o{ BLOCKS : "blocked"
    USERS ||--o{ MUTES : "muter"
    USERS ||--o{ MUTES : "muted"
    USERS ||--o{ FRIEND_REQUESTS : "requester"
    USERS ||--o{ FRIEND_REQUESTS : "addressee"
    USERS ||--o{ LIKES : "likes"
    USERS ||--o{ BOOKMARKS : "bookmarks"
    USERS ||--o{ CONVERSATION_PARTICIPANTS : "participates"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ DEVICE_KEYS : "owns"
    USERS ||--o{ REPORTS : "files"
    USERS ||--o{ ADMIN_AUDIT_LOG : "performs"

    POSTS ||--o{ POST_MEDIA : "contains"
    POSTS ||--o{ COMMENTS : "receives"
    POSTS ||--o{ LIKES : "receives"
    POSTS ||--o{ BOOKMARKS : "receives"

    CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS : "has"
    CONVERSATIONS ||--o{ MESSAGES : "contains"

    USERS {
        uuid id PK
        citext username
        citext email
        text locale
        bool is_private
        text status
    }
    POSTS {
        uuid id PK
        uuid author_id FK
        text body
        text visibility
        timestamptz deleted_at
    }
    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        bytea ciphertext
        jsonb ciphertext_meta
    }
    DEVICE_KEYS {
        uuid id PK
        uuid user_id FK
        text device_id
        bytea identity_key
    }
```

## Reading Notes
- `FOLLOWS`, `BLOCKS`, `MUTES` are each self-referential many-to-many on `USERS` (two FK roles per table) — diagrammed above with the "follower"/"followee" style role labels since a plain ERD tool would otherwise draw two ambiguous lines back to the same entity.
- `LIKES`/`BOOKMARKS` polymorphic target (doc 20 design note) isn't drawn as a formal FK relationship since Postgres itself doesn't enforce it that way — this is a known, documented exception to strict referential integrity in this schema, kept intentionally small in scope.
- Phase 2+ entities (Stories, Communities, group-chat-specific fields) will extend this diagram in a versioned follow-up once those schemas are added in doc 20, not speculatively diagrammed now.
