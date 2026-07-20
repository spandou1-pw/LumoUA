# 39 — Folder Structure

## Monorepo Layout
A single monorepo (npm/pnpm workspaces + Turborepo for task orchestration/caching) rather than separate repos per app — chosen because the shared `packages/api-types` boundary (doc 19) and shared design tokens (doc 10) need to stay in lockstep with both mobile and web, which is meaningfully easier in one repo with atomic cross-package commits than coordinating versioned package releases across separate repos at this team size.

```
kolo/
├── apps/
│   ├── mobile/              # React Native/Expo app (doc 17)
│   ├── web/                 # React web app (doc 19)
│   ├── web-public/          # SSR/static public pages: profiles, shared posts (doc 19's SEO surface)
│   ├── backend/             # NestJS API (doc 18)
│   └── admin/               # Admin panel — separate app, not a route inside the consumer web app,
│                             # since its audience/access model differs fundamentally (doc 09's IA note)
├── packages/
│   ├── api-types/           # Shared TS types generated from backend schema (doc 19)
│   ├── ui-tokens/            # Design tokens as code (doc 10) — consumed by mobile (RN theme) and web (Tailwind config)
│   ├── crypto/               # Shared Signal Protocol wrapper logic where genuinely shareable
│   │                         # between mobile and web clients (doc 26) — platform-specific native
│   │                         # bindings still live in apps/mobile, this package holds shared session logic
│   └── eslint-config/         # Shared lint/format config (doc 36)
├── infra/
│   ├── terraform/            # Cloud infrastructure as code (doc 35)
│   └── helm/                 # Kubernetes deployment charts (doc 34)
├── docs/                    # This 50-document set
├── .github/
│   └── workflows/            # CI/CD pipelines (doc 36)
└── docker-compose.yml         # Local dev stack (doc 34)
```

## Backend Internal Structure (`apps/backend/src/`)
Feature-module-per-domain, mirroring the service boundaries from doc 18:
```
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── posts/
│   ├── chat/
│   ├── feed/
│   ├── search/
│   ├── notifications/
│   ├── moderation/
│   └── admin/
├── common/
│   ├── guards/            # Authorization guards (doc 24)
│   ├── decorators/
│   ├── filters/            # Exception filters → the error envelope from doc 22
│   └── interceptors/       # Logging redaction (doc 31/37), response shaping
├── database/
│   ├── migrations/
│   └── entities/
└── main.ts
```
Each module owns its controllers, services, DTOs, and entities relevant to its domain — cross-module access goes through exported providers, not direct entity/repository reaches into another module's internals, preserving the extractable-service boundary doc 18 relies on for the eventual `chat`/`feed` service-extraction path.

## Naming Conventions
- Files: `kebab-case.ts` (e.g. `create-post.dto.ts`).
- React components: `PascalCase.tsx`.
- Test files: co-located with source (`create-post.service.spec.ts` next to `create-post.service.ts`), not in a parallel mirrored `__tests__` tree — keeps a change and its test visible together in the same directory listing.

## Rule
No cross-app imports outside the `packages/` boundary (e.g. `apps/mobile` may never import directly from `apps/web` or `apps/backend`) — enforced via lint rule (doc 36), so the only sanctioned sharing mechanism is a published internal package, keeping the dependency graph legible as the codebase grows.
