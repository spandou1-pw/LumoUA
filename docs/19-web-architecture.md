# 19 — Web Architecture

## Stack
React (not React Native Web for the full app — see rationale below) + TypeScript, Vite build tooling, React Query (shared data-fetching patterns with mobile, different implementation), Tailwind CSS for styling (token-driven, per doc 10's governance rule), deployed as a PWA for desktop support per the project's target-platform requirement.

## Why Not React Native Web
React Native Web can work for simple screens, but Kolo's web IA (doc 09) diverges meaningfully from mobile — persistent sidebar, two/three-pane chat layout, hover states, keyboard shortcuts — patterns RN Web handles awkwardly since it's optimized for making RN *components* portable, not for building genuinely web-native layouts. Web gets its own React app, sharing only the token layer (doc 10/12/13) and API client types (doc 22) with mobile, not UI component code. This matches the UI Kit doc's platform divergence note (doc 11).

## Project Structure
```
apps/web/
  src/
    routes/              # file-based or config-based routing, one route per IA surface (doc 09)
    features/            # mirrors mobile's feature-sliced structure conceptually, web-specific implementation
    shared/
      ui/                 # Tailwind + token-driven component library (web implementation of doc 11)
      api-client/         # generated from the same OpenAPI/GraphQL schema as mobile (doc 22) — shared types package
    App.tsx
packages/
  api-types/              # shared TypeScript types generated from backend schema, consumed by both apps/web and apps/mobile
```
The `packages/api-types` shared package is the actual code-sharing boundary between mobile and web — not components, but the contract (doc 18's NFR-MAINT-1).

## PWA Requirements
- Service worker: caches static assets + app shell for fast repeat loads; does **not** cache API responses long-term (feed/chat data must stay fresh — cache-then-revalidate at most for non-real-time reads).
- Web Push API for browser notifications, separate integration from mobile's APNs/FCM but feeding into the same `notifications` backend module (doc 25) — one notification-dispatch service, multiple delivery channels.
- Installable (manifest.json, icons per doc 14) so desktop users can add it as a standalone app window, satisfying "desktop support through Web/PWA" from the brief without a separate Electron build.

## Real-Time on Web
Same `socket.io` client connecting to the backend gateway (doc 18) as mobile — one real-time protocol across platforms, not a web-specific polling fallback except as a true last-resort degrade path for restrictive network environments (WebSocket-blocking corporate/institutional networks), where long-polling fallback is enabled via `socket.io`'s built-in transport negotiation.

## Rendering Strategy
Client-side rendered SPA for the authenticated app (feed/chat/profile — no SEO benefit to server-rendering content that requires login). A minimal separate static/SSR surface is used only for logged-out public pages that do benefit from SEO/link previews (public profile pages, public community pages, shareable post links) — this is a distinct, much simpler build (e.g. Next.js or Astro) from the main authenticated SPA, not the same app forced into a hybrid rendering mode.

## Accessibility & Keyboard
Web-specific accessibility work beyond the shared floor (doc 47): full keyboard navigation for the chat list + thread (arrow keys between chats, standard focus order), visible focus states on every interactive element (doc 11's rule, enforced at the primitive level so no feature can accidentally omit it).
