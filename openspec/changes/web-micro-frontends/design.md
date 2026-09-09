## Context

See proposal.md for motivation. Today the dashboard is a single Next 16 / React 19 app at `apps/web` with:

- Shell chrome in `apps/web/src/components/shell/` (`dashboard-shell.tsx`, `sidebar.tsx`, `topbar.tsx`, `nav-items.ts`)
- Domain UI in `components/jobs`, `components/board`, and settings pages under `src/app/[locale]/(dashboard)/(settings)/`
- API modules in `apps/web/src/lib/api/` and UI primitives in `apps/web/src/components/ui/`
- Turbo npm workspaces already covering `apps/*` and `packages/*`; `packages/shared-ts` exists

Out of scope for implementation: `apps/api`, `services/*`, DB, n8n. Nest OpenAPI contracts stay unchanged.

## Goals / Non-Goals

**Goals:**

- Establish a multi-zones host + three domain remotes with clear path ownership and shared packages.
- Keep public `/{locale}/...` URLs and user-visible nav stable.
- Migrate in four phases without a long-lived broken monolith: packages first, scaffold, jobs+board, settings+cutover.

**Non-Goals:**

- Module Federation, iframe remotes, or micro-frontend runtime SDKs beyond Next multi-zones / rewrites.
- Redesigning UI, adding auth, or changing Nest APIs.
- Splitting settings into more than one remote in this change.
- Changing scraper/LLM/n8n deploy topology.

## Decisions

### D1 — Composition = Next.js multi-zones / path rewrites (locked)

Shell (`apps/web-shell`) is the public origin. It rewrites/proxies path prefixes to remote apps running on separate ports (dev) or separate deployables (prod). Remotes set `basePath` / `assetPrefix` so assets resolve when served through the shell.

**Forbidden:** Module Federation; iframe embedding of remotes.

**Alternatives considered:** Module Federation (rejected — fragile with App Router and unnecessary for path-owned domains); iframe shell (rejected — weak a11y/theming/nav integration); build-time-only package composition without independent deploy (rejected — fails independent-deploy goal).

### D2 — Four apps (locked)

| App                 | Owns                                                     |
| ------------------- | -------------------------------------------------------- |
| `apps/web-shell`    | `[locale]` host, shell layout/theme/i18n/nav, rewrites   |
| `apps/web-jobs`     | `/jobs`, `/jobs/[id]`, dead-letter                       |
| `apps/web-board`    | `/board`                                                 |
| `apps/web-settings` | `/sources`, `/dictionaries`, `/profile`, `/settings/llm` |

Nav source of truth today: `apps/web/src/components/shell/nav-items.ts` (moves to shell).

### D3 — Shared packages (locked)

| Package              | Source today                                           | Role                                            |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| `packages/web-ui`    | `apps/web/src/components/ui`, `apps/web/src/lib/utils` | primitives + `cn`                               |
| `packages/web-api`   | `apps/web/src/lib/api/*`                               | client, query keys, domain modules + unit tests |
| `packages/shared-ts` | existing                                               | Nest contract types; reuse only                 |

Shell and remotes depend on these packages; no divergent API client as source of truth.

### D4 — Locale preserved (locked)

Public URLs remain `/{locale}/jobs|board|sources|...`. Shell owns locale negotiation/cookie and next-intl host wiring; remotes consume messages for their namespaces without introducing locale-less public routes.

### D5 — Nest API unchanged (locked)

No Nest/OpenAPI changes required for composition. React Query keys move with `packages/web-api` so cache identity stays shared across remotes.

### D6 — Phased delivery (locked task order)

1. Extract `packages/web-ui` + `packages/web-api` while `apps/web` still builds.
2. Scaffold `web-shell` / `web-jobs` / `web-board` / `web-settings` + Turbo multi-zone wiring (stubs OK).
3. Migrate jobs + board into remotes; shell proxies those paths; remove duplicates from monolith.
4. Migrate settings; cutover (remove or shim `apps/web`); docs/wiki/graphify; verify lint/typecheck/test/e2e.

### D7 — Ports (dev convention; adjust only if occupied)

Document in each app README during scaffold. Suggested defaults:

- shell `3000` (local dual-run with Docker `jh-web` on `:3000` → shell uses `3100`, already listed in compose `WEB_ORIGIN`)
- jobs `3001`
- board `3002`
- settings `3003`

Rewrite map (logical): shell forwards `/[locale]/jobs` → jobs, `/[locale]/board` → board, settings paths → settings. Exact Next `rewrites` / `basePath` config is an implementation detail of phase 2 but MUST preserve locale prefixes. Remotes use unique `assetPrefix` values (`/jobs-static`, `/board-static`, `/settings-static`); no Module Federation; no iframes.

### D8 — Cutover of `apps/web`

Prefer deletion of `apps/web` once shell+remotes pass gates. Allow a thin redirect shim only if CI/docs need a transitional package name. Ask before irreversible delete at implementation time.

## Risks / Trade-offs

- **[Risk] Multi-zone assetPrefix/basePath misconfig → broken CSS/JS on remotes** → Mitigate with scaffold smoke curl + Playwright against shell origin before migrating features.
- **[Risk] Shared theme/i18n drift across remotes** → Mitigate by keeping tokens and chrome in shell/`web-ui`; remotes import shared messages namespaces deliberately.
- **[Risk] Duplicate query clients if packages not adopted** → Mitigate by deleting local API modules after `web-api` extraction; typecheck fails on stale imports.
- **[Trade-off] More processes in local dev** → Accepted for independent deploy; Turbo `dev` runs them together.
- **[Trade-off] Cross-remote client state is not shared memory** → Acceptable; shared React Query keys + HTTP remain the contract. Soft navigation across zones may full-load; document if UX differs from monolith SPA transitions.

## Migration Plan

1. Land packages; keep monolith green.
2. Land empty remotes + shell rewrites; dual-run with monolith still available.
3. Move jobs/board; point shell at remotes; delete migrated monolith routes.
4. Move settings; make shell the only entry; remove/shim `apps/web`; update `docs/ARCHITECTURE.md` and wiki; `graphify update .`.
5. Rollback: retain previous monolith commit / re-enable `apps/web` package until cutover commit; remotes unused if rewrites disabled.

## Open Questions

None that block specs or task breakdown. Exact production ingress (single reverse proxy vs platform multi-service) is deferred as deploy topology documentation in phase 4 without changing path ownership.
