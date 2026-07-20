# WEB_DESKTOP.md — Desktop & Web Platform (Stage 12)

## What was actually verified vs. what couldn't be

Same honesty standard as MOBILE.md (Stage 11), different toolchain gap: this sandbox has **no Rust toolchain** (`cargo`/`rustc` not installed) — I could not compile or run the Tauri desktop shell. What I could and did verify:

- `npx tsc --noEmit` on the web app (Next.js/TypeScript) — **0 errors**.
- `npx jest` — **11/11 tests pass**, using `next/jest` (real SWC transform, real `@testing-library/react` rendering) — including a dedicated suite (`test/bridge.test.ts`) that exercises both the web-fallback and the Tauri-present code paths of the native capability bridge by mocking `window.__TAURI__`.
- The Rust source (`src-tauri/src/main.rs`) targets Tauri 1.x's documented API — it's real, intended-to-compile code, not pseudocode — but is unverified against an actual `cargo build`. Treat it as a solid first draft to compile-check in a real Rust environment before shipping, the same way MOBILE.md flagged the Expo native build as the next real step there.

## "Do not wrap the website" — what that means concretely here

A wrapped website is an Electron/Tauri shell pointing a webview at your live production URL, with maybe one or two native APIs bolted on. This build does the opposite in three specific ways:

1. **Local, not remote**: `tauri.conf.json`'s `distDir` points at a locally-built static export (`../dist-web`, produced by `next build && next export`), never a URL. The desktop app ships its own frontend assets; it doesn't depend on network access to render at all past the API calls the app itself makes.
2. **Real native APIs, not a thin shim**: `src/native/bridge.ts` is the single place every native-capable feature branches on `isDesktop()`, and each branch calls a *real* Tauri command (global shortcuts, native notifications, native file dialogs, native multi-window creation) — not a JS-only reimplementation pretending to be native.
3. **Progressive enhancement, not feature-gating**: the exact same React/Next.js codebase renders identically in a browser tab (PWA) and inside the Tauri webview. Desktop-only capabilities (Automatic Updates, OS-level global shortcuts) are additive — shown/enabled only where they're real (`isDesktop()` checks in the Settings page, doc'd in `app/settings/page.tsx`) — rather than the web version being a crippled subset or the desktop version being a completely separate codebase.

## Feature → implementation map

| Requested feature | Implementation |
|---|---|
| Native Notifications | `bridge.ts` → Tauri `notification` plugin (desktop) / Web Notifications API (browser) |
| Keyboard Shortcuts | In-app (`useInAppShortcut`, identical on web+desktop, e.g. ⌘K search) + OS-level global shortcut (`register_global_shortcuts` in `main.rs`, desktop-only — a browser tab structurally cannot claim a system-wide hotkey, so this is a real, not artificial, platform difference) |
| Drag & Drop | Two real paths, both wired: HTML5 DnD in the web layer (`app/feed/page.tsx`'s drop zone, works identically in-browser and in the Tauri webview for drops originating inside the window) + Tauri's OS-level `FileDrop` window event (`main.rs`, for drops from the native file manager) |
| File Management | `pickFile`/`saveFile` in `bridge.ts` — native file dialogs via Tauri's `dialog`/`fs` plugins on desktop, standard `<input type=file>` / download-link on web |
| Window Management | `openInNewWindow` — real Tauri multi-window creation (`create_window` Rust command) on desktop, real `window.open()` popup on web (not a no-op either way) |
| Offline Cache | `public/sw.js` — caches the app shell, explicitly never caches API responses (doc 19's rule, same reasoning as the mobile app's React Query staleTime approach) |
| Automatic Updates | `tauri.conf.json`'s `updater` config (real endpoint/pubkey placeholders — needs a real signing key generated before shipping) + explicit "Check for updates" action in Settings, desktop-only (no web equivalent exists — a browser tab is always the latest deploy) |
| PWA | `public/manifest.json` + service worker registration (`providers.tsx`) — installable, works for both pure-web deployment and as the asset source the desktop shell wraps |
| Responsive UI | `AppShell`'s sidebar collapses to icon-only below 900px via CSS media query (no separate mobile-web layout branch to maintain) |
| Accessibility | Skip-link, `:focus-visible` ring on every interactive element, `aria-live`/`role="alert"` on state changes, `aria-pressed`/`aria-current` on toggle/nav state — see the dedicated section below for what's NOT covered |
| Every feature available on Mobile | See the parity table below — honest, not a checkbox |
| Testing | `test/ui.test.tsx`, `test/bridge.test.ts` |
| Documentation | This file |

## Mobile parity — honest comparison

Stage 11 (mobile) built Splash, Onboarding, Login, Registration, Feed, Profile, Wallet, Settings as real working screens; a later follow-up pass added Premium, Gift Store, Notifications, and a metadata-only Messenger conversation list on both mobile and web/desktop simultaneously (the same Next.js pages Tauri wraps, so building for web automatically extends Windows/Mac too — no separate desktop-only screen work was needed). Stories, Channels, Search, native Payments, and real-time Messenger *content* (blocked on client-side E2E crypto, see below) remain unbuilt on every client, for the same underlying reasons named in MOBILE.md: some are blocked on backend readiness (Stories, Channels, Search), others simply haven't been reached despite the backend being ready (native IAP, full Messenger).

## Security note carried over from the web API client

`doc 23` specifies an HttpOnly cookie for the web refresh token — the properly hardened pattern, closing the XSS-can-read-localStorage surface. The actual Stage 4 backend returns tokens in the JSON response body (built for mobile's needs, where SecureStore is the right store), so this web client uses `localStorage` for the refresh token with the tradeoff named explicitly in `api/client.ts`'s top comment rather than silently assumed safe. Migrating `/auth/login` to *also* set an HttpOnly cookie for browser-originated requests (detected via a header or a separate endpoint) while still returning tokens in-body for mobile is the concrete hardening follow-up — flagged here, not fixed blindly without being asked, consistent with how this project has handled every other security tradeoff.

## Dependency security note

`npm audit` flags Next.js 14.2.x server-mode vulnerabilities (Server Components DoS, Middleware cache poisoning, Image Optimization API issues). This app runs with `output: 'export'` — a pure static build with no Node server, no Server Components execution, no Middleware, and no Image Optimization server at runtime — so these specific advisories don't apply to how this app is actually deployed. Upgrading to Next 15/16 (a breaking change) wasn't done blindly without the ability to fully regression-test the migration in this environment; it's a reasonable next step with real testing, not a "should have just done it" gap.

## Accessibility — what's actually done vs. a real audit

Done: skip-link (first tab stop bypasses the sidebar), visible focus rings everywhere (no `outline: none` without a replacement), semantic `role="alert"` on errors, `aria-pressed`/`aria-current`/`aria-busy` reflecting real component state, keyboard-operable everything (no mouse-only interactions).

Not done: a full WCAG 2.1 AA audit (doc 47's standard) — screen-reader flow testing (NVDA/VoiceOver on macOS), color contrast verification against actual rendered CSS custom-property values across both light/dark modes, and full keyboard-trap testing on any future modal/dialog components. Same honest gap as MOBILE.md's accessibility section, for the same reason: this needs real assistive-technology testing this environment can't perform.

## Testing

- `test/ui.test.tsx` — Button (click/disabled/loading states), ErrorState (message + retry, alert role), EmptyState (action firing).
- `test/bridge.test.ts` — the native capability bridge's dual-path behavior: confirms `isDesktop()` correctly reflects `window.__TAURI__` presence, confirms desktop-only functions (`checkForUpdates`) are honest no-ops on web rather than fake successes, and confirms the Tauri path actually calls `invoke` with the right command name when `window.__TAURI__` is present.
- **Not yet covered**: the Rust side has no test coverage (no Rust toolchain available to run `cargo test` in this environment) — this is the same category of gap as MOBILE.md's "on-device verification," not a different one.

## Explicitly not built

- Messenger, Stories, Channels, Communities, Notifications, Search, Premium (dedicated screen), Gift Store, Voice/Video Calls — see the parity table above.
- Compiled/tested Tauri binaries for Windows/macOS — Rust source exists, compilation is unverified (no toolchain here).
- HttpOnly-cookie-based refresh token storage for web — flagged tradeoff, not silently fixed without a corresponding backend change being explicitly requested.
