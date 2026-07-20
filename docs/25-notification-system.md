# 25 — Notification System

## Scope (Phase 1)
Push notifications for: new message, new follower, new comment/like on own post, friend request received/accepted (NOTIF-1). In-app "live" real-time notification center (NOTIF-2) is Phase 3, though the underlying event pipeline below is built once and reused, not rebuilt for Phase 3.

## Architecture
```
[domain event: e.g. comment created]
        │
        ▼
[NestJS event emitter] ──► [notifications module]
        │                          │
        │                          ▼
        │                 [preference check: has user
        │                  muted this notification type?]
        │                          │
        │                          ▼
        │                 [BullMQ job: dispatch]
        │                          │
        │              ┌───────────┼────────────┐
        │              ▼           ▼            ▼
        │           APNs         FCM        Web Push
        │        (iOS push)  (Android push) (browser)
```
Domain events (comment created, follow received, etc.) are emitted internally via NestJS's event system at the point of the originating action — the `notifications` module subscribes and never sits inline in the critical write path (creating a comment doesn't wait on push dispatch to return success to the client), consistent with doc 18's background-job separation principle.

## Delivery Channels
- **iOS**: APNs, via Expo's push service (wraps APNs so the mobile client doesn't need direct APNs certificate management — simplifies the Phase 1 build; revisit direct APNs integration only if Expo's push service becomes a real limitation at scale).
- **Android**: FCM, same Expo-wrapped path.
- **Web**: Web Push API (VAPID keys), separate subscription registration flow from mobile but converging on the same `notifications` module dispatch logic (doc 19).

## Content Policy
- Message notifications show sender name only, never message content in the push payload body — content is E2E encrypted server-side (doc 26/31) and shouldn't be reconstructable from a push notification even in principle; the notification's job is "tell the user to open the app," not preview encrypted content.
- Other notification types (like, comment, follow) can show minimal contextual text ("Марія commented on your post") since that data isn't E2E-protected content.

## User Preferences
Per-type toggle (messages / social engagement / friend requests), not just a single global on/off — stored per-user, checked before job dispatch (diagram above). Respecting mute/block relationships is enforced at the same check point: a blocked user's engagement never generates a notification, regardless of per-type preference state.

## Reliability
- Failed push dispatch (expired device token, provider error) retried with backoff via BullMQ, capped retries, then the stale device token is marked inactive rather than retried indefinitely.
- Notification dispatch is at-least-once, not exactly-once — client-side de-duplication (by event ID) handles the rare double-delivery case rather than adding distributed-transaction complexity to guarantee exactly-once at the backend, which isn't proportionate to the cost of an occasional duplicate push.

## Phase 3 Addition (in-app live notification center)
Reuses the same domain-event pipeline; adds a WebSocket dispatch branch (parallel to the push branches above) so a currently-open app receives the notification instantly in-app rather than as an OS-level push (avoiding redundant/annoying double-notification when the app is already in foreground — foreground state suppresses the OS push branch specifically for that connected session).
