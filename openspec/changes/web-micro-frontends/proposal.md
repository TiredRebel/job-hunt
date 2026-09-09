## Why

`apps/web` is a single Next.js monolith that owns shell chrome and every product domain (jobs, board, settings). Independent deploy, isolated ownership, and bounded blast radius for UI changes are blocked until the frontend is split into a host shell plus domain remotes that still present one locale-prefixed URL space to the user.

## What Changes

- Split the web UI into four independently deployable Next apps composed with **Next.js multi-zones / path rewrites** (NOT Module Federation, NOT iframes):
  - `apps/web-shell` — locale routing, dashboard shell (sidebar/topbar), theme, i18n host, zone proxy
  - `apps/web-jobs` — `/jobs`, `/jobs/[id]`, dead-letter
  - `apps/web-board` — `/board`
  - `apps/web-settings` — `/sources`, `/dictionaries`, `/profile`, `/settings/llm`
- Extract shared libraries from the monolith:
  - `packages/web-ui` — UI primitives today under `apps/web/src/components/ui` plus `cn`/utils
  - `packages/web-api` — typed API client modules and React Query keys today under `apps/web/src/lib/api`
  - Reuse existing `packages/shared-ts` (no Nest contract changes)
- Preserve the public `[locale]` URL prefix and user-visible navigation routes from `apps/web/src/components/shell/nav-items.ts`.
- Retire monolith `apps/web` as the primary entry (remove or thin redirect shim) after remotes are live; update architecture docs and wiki.
- **BREAKING** (for local/dev tooling only): developers run shell + remotes (multi-port / Turbo) instead of a single `apps/web` process. Public product URLs stay the same.

## Capabilities

### New Capabilities

- `web-micro-frontends`: composition rules for the shell + remotes (multi-zones path ownership, shared packages, locale-preserving public routes, forbidden composition models, cutover from `apps/web`).

### Modified Capabilities

- `web-app-shell`: shell host moves to `apps/web-shell`; typed API access layer is required to live in `packages/web-api` (built on `packages/shared-ts`); shell composes domain remotes via multi-zones rather than in-process App Router pages for jobs/board/settings.

## Impact

- **Frontend apps**: new `apps/web-shell`, `apps/web-jobs`, `apps/web-board`, `apps/web-settings`; eventual removal or shim of `apps/web`.
- **Packages**: new `packages/web-ui`, `packages/web-api`; `packages/shared-ts` reused as-is.
- **Unchanged**: `apps/api` OpenAPI/Nest contracts, `services/*`, DB schema, n8n.
- **Tooling**: Turbo workspace scripts for parallel shell+remotes; Playwright e2e against the shell origin.
- **Docs**: `docs/ARCHITECTURE.md`, wiki architecture/current-state pages after cutover.
