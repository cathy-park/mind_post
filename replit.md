# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (auth + journal CRUD)
│   └── onul-letter/        # React+Vite mobile-first web app "오늘의 편지"
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # Replit OIDC auth hook (useAuth) for web apps
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `lib/replit-auth-web` (`@workspace/replit-auth-web`)

Replit OIDC auth hook for React web apps. Exports `useAuth()` which calls `GET /api/auth/user` and provides `{ user, isLoading, isAuthenticated, login, logout }`. The `login` function redirects to `/api/login?returnTo=<base>`. Import via `@workspace/replit-auth-web`.

### `artifacts/onul-letter` (`@workspace/onul-letter`)

Mobile-first Korean journaling web app "오늘의 편지". All UI in Korean. Built with React + Vite + TailwindCSS. Mascots: 모아 (collects emotions) and 포스트 (delivers memories).

**Auth**: Gated by `AuthGate` in App.tsx using `useAuth()`. Unauthenticated users see a login screen. After login via Replit OIDC, journal data is persisted in PostgreSQL via the API server. All journal hooks (`use-journal.ts`) fetch from `/api/entries` with `credentials: 'include'`.

**Scroll layout pattern** (all 6 screens): Inner-scroll architecture — the `MobileContainer`'s `main` element remains `overflow-y-auto` but does NOT scroll in practice because each page's root child is `div.flex.flex-col.h-full` (exactly fills the content-box). Inside that wrapper: the header section is `flex-shrink-0` (no `sticky` or `z-index` needed), and the content area is `flex-1 min-h-0 overflow-y-auto` with `paddingBottom: max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))` for bottom nav clearance. The `min-h-0` is critical — without it flex children don't respect their height limit and overflow the parent.

**Data model (client-side)**:
- `JournalEntry`: id, date (YYYY-MM-DD), emotion, shortAnswer, longAnswer?, photo?, weekday, reflections[], createdAt
- `Reflection`: id, content, createdAt (mapped from `comment` in API response)

**Routing (in-app)**: `/ /record /archive /time-letter /calendar /settings` (Wouter)

**API calls**: Relative paths (`/api/...`). The Replit proxy routes `/api/*` to the api-server (port 8080) and everything else to the web app (port 22103).

**Settings**: Still stored in localStorage. Journal entries are in PostgreSQL.

**Web Push Notifications**: Full real push notification system using the Web Push Protocol.
- Service worker: `public/sw.js` — handles `push` events, shows system notification, opens app on click
- Hook: `src/hooks/use-push.ts` — requests permission, subscribes via `PushManager`, syncs with API server
- Settings page: toggle ON → `subscribe()` → browser permission dialog → save subscription to DB; toggle OFF → `unsubscribe()`; time picker → `updateReminderTime()` → PATCH to API
- VAPID public key exposed via `import.meta.env.VITE_VAPID_PUBLIC_KEY` (injected by vite.config.ts from `VAPID_PUBLIC_KEY` env var)
- API calls go through Vite proxy: `/api/*` → `localhost:8080`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
