# 17 — Mobile Architecture

## Stack
React Native + Expo (managed workflow with custom dev client — pure Expo Go isn't viable once native modules like WebRTC and E2E crypto libraries enter the picture), TypeScript strict mode, React Navigation, React Query for server state, Zustand for local/UI state, React Hook Form for forms.

## Why Expo (custom dev client) over bare React Native
Expo's tooling (EAS Build, EAS Update) meaningfully speeds up the two-platform (iOS+Android) release cycle a small team needs, while the custom dev client escape hatch means we're not blocked when a feature (WebRTC calls in Phase 3, background E2E key handling) needs a native module Expo's managed SDK doesn't cover. Re-evaluate only if a specific native requirement proves incompatible with the dev-client model.

## Project Structure
```
apps/mobile/
  src/
    app/                 # React Navigation route tree
    features/            # feature-sliced: auth/, feed/, chat/, profile/, stories/...
      <feature>/
        components/
        hooks/
        api/              # React Query hooks calling the shared API client
        store/            # Zustand slice, if the feature needs local state beyond server cache
    shared/
      ui/                 # UI Kit primitives (doc 11) — platform implementation
      api-client/         # typed client generated from OpenAPI/GraphQL schema (doc 22)
      crypto/             # Signal Protocol wrapper (doc 26)
      theme/              # design tokens (doc 10/12/13) as RN theme objects
    App.tsx
```
Feature-sliced over type-sliced (not global `components/`, `hooks/`, `screens/` folders) — keeps related code together as the app grows past a handful of features, avoiding the common "hundreds of files in one `components/` folder" failure mode at this scale.

## State Management Split
- **Server state** (posts, chats, profile data): React Query exclusively — cache invalidation, optimistic updates (NFR-PERF-4), background refetch. No server data duplicated into Zustand.
- **Local/UI state** (compose draft text, active tab, ephemeral UI toggles): Zustand, scoped per-feature, not one global store — avoids the "everything imports the mega-store" coupling problem.
- **Real-time state** (live message delivery, typing indicators): WebSocket events feed directly into React Query's cache via `queryClient.setQueryData`, so the rest of the app doesn't need a separate real-time state layer to reason about.

## Navigation
Root stack: Auth stack (unauthenticated) ↔ Main tab navigator (per doc 09 IA: Feed, Search, Compose-modal, Messages, Profile), each tab owning its own nested stack. Deep linking configured for push-notification-driven navigation (e.g. tapping a message notification opens directly into that chat thread, not the app's default landing screen).

## Offline & Sync Strategy
- React Query persisted cache (via AsyncStorage/MMKV) so the app shows last-known content immediately on cold start before revalidating — supports the ≤2.5s cold-start target from doc 05 by not blocking first paint on a network round-trip.
- Outbound message/post queue: locally persisted queue, retried with backoff on reconnect, visible "sending"/"queued" state in UI (doc 08 flow 2 edge case).
- MMKV chosen over AsyncStorage for anything performance-sensitive (E2E session state, frequently-read cache) due to its synchronous, faster access pattern; AsyncStorage acceptable for low-frequency data.

## Native Modules of Note
- E2E crypto (Signal Protocol implementation) — native module wrapping a vetted library, never a pure-JS reimplementation of cryptographic primitives (security-critical; doc 31 elaborates).
- WebRTC (Phase 3) — `react-native-webrtc` or equivalent, isolated behind a clean interface so the calling feature module doesn't leak WebRTC specifics into UI code.
- Push notifications — Expo Notifications wrapping APNs/FCM.

## Performance Practices
- Lists (feed, chat, search results) use `FlashList` (not the base `FlatList`) for the 60–120fps scroll target in doc 05.
- Images: progressive loading with blurhash/low-res placeholder → full-res swap, all images served through the CDN pipeline (doc 30) at device-appropriate resolutions, never full-res originals in list views.
- Reanimated worklets for all gesture-driven and signature (doc 16) animations — no JS-thread-driven animation for anything user-interactive.
