# 23 — Authentication

## Methods (Phase 1)
- Email + password: password hashed with **argon2id** (not bcrypt — argon2id is the current recommended default for new systems, better resistance to GPU-based cracking), email verification required before full account activation (unverified accounts can complete profile setup but are flagged, with limited action rates, until verified).
- Google OAuth: standard OAuth 2.0 / OIDC flow, verifies the provider's ID token server-side (never trusts a client-supplied "I logged in with Google" claim without server verification).
- Apple Sign In: required if any third-party OAuth exists and the app ships on iOS (App Store policy), same server-side verification posture.

## Token Model
- **Access token**: JWT, 15-minute expiry, signed with an asymmetric key (RS256) so resource servers can verify without calling the auth service — supports the modular-monolith-to-services evolution path from doc 18 without a token redesign later.
- **Refresh token**: opaque random token (not JWT — no need for it to be self-describing), stored hashed in the database, 30-day expiry, rotated on every use (old refresh token invalidated the moment a new one is issued — detects token theft: if a stolen refresh token is used after the legitimate one already rotated, the reuse is detectable and triggers a full session invalidation for that device).
- Refresh tokens are scoped per-device (ties to `device_keys`/session concept in doc 20/17's device management, AUTH-7) so a user can see and revoke individual device sessions rather than only a global logout.

## Account Linking
If a user attempts OAuth login with an email matching an existing email/password account, they are **not** auto-merged (doc 08 flow 1 edge case) — shown an explicit "an account with this email already exists, log in with your password to link Google" step. Prevents an account-takeover vector where an attacker who controls a victim's OAuth provider email (e.g. a stale/compromised email account) could silently gain access to an existing password-protected account.

## Two-Factor Authentication (Phase 4)
TOTP-based (RFC 6238), backup codes issued at setup (single-use, regenerable), enforced at login as a second step after password/OAuth verification succeeds — not built in Phase 1 per doc 03 phasing, specified here so the token/session model above doesn't need rearchitecting when it ships.

## Passkeys (Phase 4)
WebAuthn-based, stored as an additional `auth_identities` provider type (schema in doc 20 already generalizes to this via the `provider` column) — passkey registration/assertion handled per platform's native WebAuthn APIs (iOS/Android/Web all have first-party support).

## Session Security
- Refresh token cookie (web) is `HttpOnly`, `Secure`, `SameSite=Strict` — never exposed to JS, mitigating XSS-based token theft on web specifically.
- Mobile stores refresh token in platform secure storage (Keychain/Keystore via Expo SecureStore), never in plain AsyncStorage.
- All auth endpoints rate-limited per doc 22/31; failed login attempts trigger exponential backoff per-account beyond a threshold, independent of the per-IP limit (defends against distributed credential-stuffing that spreads attempts across many IPs).

## Logout & Revocation
`POST /auth/logout` invalidates the current device's refresh token. A separate "log out of all devices" admin-panel-visible-to-user action invalidates all refresh tokens for the account — surfaced in Settings → Data & Security per doc 09 IA, available even before Phase 4's full device management UI ships (a minimal "log out everywhere" button is a Phase 1 security floor, not deferred).
