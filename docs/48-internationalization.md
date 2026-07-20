# 48 — Internationalization

## Scope
Two locales at launch: Ukrainian (`uk`, default) and English (`en`) — no Russian, by explicit product decision (doc 01). This doc covers the *mechanics* of i18n; the product-stance rationale lives in doc 01 and isn't repeated here.

## String Externalization
No hardcoded user-facing strings anywhere in the codebase, from the first commit (doc 05 NFR-I18N-2, restated here as the concrete implementation rule) — enforced via an ESLint rule (doc 40) flagging string literals in JSX/template contexts that aren't routed through the i18n library, catching violations at PR time rather than relying on manual review discipline alone.

## Tooling
- Mobile/Web: `i18next` (mature, well-supported React/React Native integration, handles pluralization and interpolation well for Slavic-language plural rules — see below).
- Translation files: JSON, organized per-feature (`locales/uk/chat.json`, `locales/en/chat.json`) mirroring the feature-sliced folder structure (doc 39), not one giant flat file, so translators and engineers can find relevant strings without wading through the entire app's copy.

## Ukrainian Pluralization
Ukrainian has more plural forms than English (one/few/many/other, per CLDR plural rules — e.g. "1 повідомлення," "2 повідомлення," "5 повідомлень" all need distinct forms), which `i18next`'s ICU/plural support handles, but **only if translation strings are authored with the correct plural categories from the start** — this is called out explicitly because it's a common source of subtly-wrong Ukrainian UI copy when a system is built plural-rule-naively around English's simple one/other split and Ukrainian strings are retrofitted in afterward.

## Locale-Aware Formatting
- Dates/times: `Intl.DateTimeFormat` with the user's selected locale (doc 05 NFR-I18N-3) — Ukrainian date conventions (day-month-year, different month-name grammar cases depending on sentence position) applied correctly, not just a translated month name inserted into an English-shaped date string.
- Numbers: `Intl.NumberFormat` — Ukrainian uses a space as the thousands separator and a comma as the decimal separator, distinct from English conventions, handled automatically by the locale-aware formatter rather than hardcoded.

## Layout Accommodation
Per doc 13's note: Ukrainian strings commonly run longer than their English equivalents. Practical rules: no fixed-width text containers for translatable labels (buttons/chips size to content, doc 11), no text truncation assumptions baked into layout math that were only tested against English placeholder copy — this is specifically flagged as a QA checkpoint (doc 38): every screen should be visually reviewed in **both** locales before a milestone is considered complete, not just the locale the engineer happened to develop in.

## Locale Selection & Persistence
Explicit selection during onboarding (doc 08 flow 1) rather than silent inference from device locale/IP geolocation alone — device locale is used as the *default suggestion* (defaulting to Ukrainian per the product's primary-audience stance if the device locale is ambiguous), but the user's explicit choice always overrides it and persists with their account (server-side, in `users.locale` per doc 20), not just as a device-local setting, so the experience is consistent across their devices.

## Content vs. UI Localization (Important Distinction)
This doc covers **UI chrome** localization (buttons, labels, system messages). User-generated content (posts, messages, bios) is never translated or altered — it's rendered exactly as authored, in whatever language/script the author used, regardless of the viewer's selected UI locale. Machine-translation of user content (e.g. an optional "translate this post" feature) is a distinct, not-yet-scoped future feature, not implied by anything in this doc.

## Translator Workflow
Translation keys are extracted automatically from code (via the i18next tooling's extraction step) into a review-ready format for human translators — machine-translated placeholder text is acceptable *during development* for engineers to see approximately-correct-length strings, but is explicitly never shipped to production without human review, especially for Ukrainian given the product's stated quality bar (doc 01 Pillar 4) — a machine-translation artifact reaching real users would directly undercut that pillar.
