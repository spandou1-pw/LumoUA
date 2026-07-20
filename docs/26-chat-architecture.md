# 26 — Chat Architecture

## Encryption Protocol
**Signal Protocol** (X3DH key agreement + Double Ratchet for ongoing session encryption) for direct (1:1) chats — the decision recorded in doc 02, elaborated here. Chosen over rolling a custom protocol (never justified for cryptographic primitives — doc 31) and over simpler alternatives (e.g. static asymmetric encryption without ratcheting) because forward secrecy and post-compromise security are core to the "legible encryption" trust goal from doc 06/07 (Persona 3).

## Key Material & Session Setup
1. On first launch/device registration, client generates: an identity key pair, a signed prekey, and a batch of one-time prekeys.
2. Public halves published to the server via `POST /devices/keys` (doc 22) — stored in `device_keys` (doc 20). Private halves never leave the device.
3. To start a conversation, the initiating client fetches the recipient's current prekey bundle (`GET /devices/:userId/keys`), performs X3DH locally to derive a shared secret, and begins the Double Ratchet — all client-side; the server only ever brokers public key material, never participates in the cryptographic handshake itself.
4. Each subsequent message ratchets the session key forward — compromise of a single message key doesn't expose past or future messages (forward secrecy / post-compromise security).

## Multi-Device Support
`device_keys` schema supports multiple `device_id` rows per user (Phase 1 targets single active mobile device + web as a second device — true multi-device fan-out, where a message is independently encrypted per recipient device, is scoped for Phase 2 alongside group chat, since group ratcheting and multi-device fan-out share underlying complexity worth solving together rather than twice).

## Group Chat (Phase 2)
Direct Double Ratchet doesn't scale cleanly to groups. Two realistic options to evaluate at Phase 2 kickoff (not decided prematurely here, since real group-size/usage data from Phase 1 should inform this):
- **Sender Keys** (Signal's group approach): each member has a symmetric key they use to encrypt to the whole group, distributed 1:1 (via the already-built pairwise ratchets) to each member — simpler, well-precedented, weaker forward-secrecy properties on membership changes.
- **MLS (Messaging Layer Security, RFC 9420)**: purpose-built for group E2E with better scaling and stronger security properties on member add/remove, but a heavier implementation lift and less mature client-library ecosystem as of this writing.
Recommendation to revisit at Phase 2 planning: start with Sender Keys for time-to-ship, keep the message/session schema abstract enough (`ciphertext_meta` JSONB in doc 20) that a later MLS migration doesn't require a full schema rewrite.

## Channels (Phase 2)
Channels are explicitly **not** E2E encrypted (doc 04 MSG-4 note) — they're one-to-many broadcast/public content, closer to posts than to private messages; encrypting them would add complexity with no meaningful privacy benefit since channel content is public by design. Channel messages can reuse the `posts`-adjacent content model rather than the `messages` E2E pipeline — a deliberate architectural fork, not an oversight.

## Delivery & Read Receipts
- Delivery confirmation: recipient device ACKs receipt over WebSocket → `message:delivered` event → sender UI updates (doc 22 events).
- Read receipts: client-side "read" event on message view, respecting a user-level setting to disable read receipts entirely (if disabled, the user also doesn't see others' read receipts — symmetric, matching the common WhatsApp/Telegram convention users already expect, avoiding a one-sided-information UX that would feel exploitative).

## Message Editing & Deletion
- Edit: allowed within a time window (TBD exact duration, default proposal 15 minutes) — edited message re-encrypted and re-sent as a new ciphertext blob with an `edited_of` reference; original ciphertext retained server-side only long enough to support "view edit history" if that UX is decided on later, otherwise purged — exact retention policy finalized alongside doc 45 (Backup Strategy) and doc 49 (Legal) since message retention has real legal/privacy tradeoffs beyond pure engineering.
- Delete for me: client-side hide, no server change (doesn't affect other participants).
- Delete for everyone: server marks `messages.deleted_at`, ciphertext blob purged (not just flagged) since retaining unreadable ciphertext after a user explicitly requested deletion still represents unnecessary data retention.

## Offline Message Handling
Messages sent to an offline recipient are queued server-side (encrypted, at-rest per doc 31) and delivered on next connect — standard store-and-forward, bounded by a retention window (proposal: 30 days undelivered → still retained since Postgres storage cost here is low, but flagged for real review once storage/legal costs are modeled in doc 45).
