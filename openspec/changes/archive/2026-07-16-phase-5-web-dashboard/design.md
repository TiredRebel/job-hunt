# Design — Phase 5 Web app (NextJS dashboard)

## Context

`apps/web` is the create-next-app skeleton from Phase 0: one root layout, placeholder page, default Tailwind v4 `globals.css`. Everything else exists and is stable:

- `apps/api` (NestJS 11, `http://localhost:4000`, prefix `/v1`) exposes jobs, profiles, keyword-dictionaries, reactions, llm-admin and sources endpoints; OpenAPI spec with 30 named schemas; bigint ids serialized as strings.
- `packages/shared-ts` re-exports the generated `ApiPaths`/`ApiOperations` types (openapi-typescript) plus `ReactionStage` and `Locale` unions.
- `docs/UI_DESIGN.md` is the locked visual/UX spec: tokens, dark-first theming, dense TanStack table, dnd-kit kanban, EN+UA i18n, motion budget, WCAG AA gates.

**Framework reality check:** the installed version is **Next 16.2.10** (not 15). Verified against `node_modules/next/dist/docs/`:

- `params` / `searchParams` are **Promises** — must be `await`ed in pages/layouts.
- **Middleware is renamed Proxy** (`proxy.ts`) — affects next-intl locale handling.
- Tailwind v4 CSS-first config (`@theme` in `globals.css`, no `tailwind.config.ts`).
- `fetch` in Server Components is uncached by default; caching is opt-in (`use cache`).

Constraints from `docs/CODING_STANDARDS.md`: TS strict extras (`exactOptionalPropertyTypes`, `noImplicitOverride`, `noUncheckedIndexedAccess`), TSDoc on all exports (eslint-enforced), Server Components by default, data fetching in the server layer, Vitest + Playwright.

**Known contract gaps** (from reading `packages/shared-ts/src/generated/api.ts`):

1. `JobsController_list_v1` has `parameters.query?: never` — the list filters exist in `ListJobsQueryDto` (`apps/api/src/jobs/jobs.dto.ts`) but were never emitted into OpenAPI (the tsx/esbuild `design:paramtypes` gotcha from Phase 4 applies to `@Query()` DTOs too). The typed client cannot build filtered requests today.
2. No cover-letter endpoints exist anywhere in the spec, but UI_DESIGN §5.3.6 requires a cover-letter viewer/editor.
3. `JobResponse` has `matchScore` but no match explanation, required by UI_DESIGN §5.3.3.

## Goals / Non-Goals

**Goals:**

- Ship all UI_DESIGN §5 screens: `/jobs`, `/board`, job detail (drawer + `/jobs/[id]`), `/settings/llm`, `/dictionaries`, `/sources`, `/profile`.
- Token-driven dark/light theming, EN+UA i18n, keyboard flow, WCAG AA — the §8 gates are blocking, not aspirational.
- All server communication through one typed API-client layer built on `shared-ts` types.
- Close the three contract gaps in `apps/api` and regenerate the client (prerequisite work, kept minimal and additive).
- Playwright happy-path e2e in both locales.

**Non-Goals:**

- Density toggle, saved filter presets, charts (UI_DESIGN §11 — post-MVP).
- Notifications UI (Phase 6 owns Telegram/email; dashboard notifications later).
- Auth (single local user; ARCHITECTURE lists auth at the gateway, nothing exists yet — out of scope here).
- Mobile layouts (desktop-first ≥1280px, functional to 1024px; mobile is read-only convenience).
- Global state libraries (Redux/Zustand) — see Decisions.

## Decisions

### D1. Data fetching: typed fetch wrapper + TanStack Query on the client

A small hand-written client in `apps/web/src/lib/api/` wraps `fetch` with types derived from `ApiPaths`/`ApiOperations` (path params, query, body, response inferred per operation). Server Components call it directly for first paint (jobs list page, settings pages); client components use **TanStack Query** (`@tanstack/react-query`) for refetching, mutations, optimistic updates and cache invalidation (filter changes, kanban moves, bulk actions, connection tests).

- _Why not `openapi-fetch`?_ It would work (same openapi-typescript output), but a ~100-line wrapper avoids a runtime dependency in `shared-ts` (which is types-only by charter) and keeps `exactOptionalPropertyTypes` friction under our control. Revisit if the wrapper grows.
- _Why TanStack Query and not server actions everywhere?_ The dashboard is interaction-heavy (filters, optimistic kanban, bulk bars). Query's cache + `onMutate`/`onError` rollback pattern directly implements UI_DESIGN's "optimistic update, toast on failure with undo". Server actions remain an option for simple form saves (profile) but are not required.
- Base URL from `NEXT_PUBLIC_API_URL` (client) / `API_URL` (server), validated by a zod config module.

### D2. Server vs client component split

Server Components by default (standards). Concretely:

- **Server**: route layouts, page shells, initial data fetch for `/jobs` (reads `await searchParams`, fetches page 1 server-side, passes to the table as `initialData` for hydration), `/jobs/[id]` full page (`await params`), settings/sources/dictionaries/profile initial reads.
- **Client** (`'use client'` islands): `JobTable` + `FilterBar` + `BulkActionBar` (TanStack Table/Query, virtualization, keyboard handlers), `StageBoard` (dnd-kit), `JobDrawer`, all forms, `ThemeToggle`, `LocaleSwitch`, ⌘K command palette.
- Filter state lives in the **URL** (`searchParams`) so views are shareable/bookmarkable and back/forward works; the filter bar updates the URL via `router.replace` with shallow-ish semantics and Query keys derive from the parsed params. `nuqs` may be used for typed searchParams parsing if hand-rolling gets noisy — decide at implementation time, it's a leaf dependency.

### D3. Theming: UI_DESIGN tokens as CSS variables + Tailwind v4 `@theme inline`

`globals.css` defines UI_DESIGN §2.1 palette on `:root` (light) and `.dark` (dark); `@theme inline` maps them to Tailwind color tokens (`bg-surface`, `text-muted`, `border-border`, …). `next-themes` with `attribute="class"`, `defaultTheme="system"`, plus `suppressHydrationWarning` on `<html>`. shadcn/ui components consume the same variables (its Tailwind v4 preset convention). Enforcement per §3: no `dark:` color overrides for tokenized colors, no hex literals in components — checked in review, optionally a grep-based lint script.

Fonts: **Geist Sans stays via `next/font` (already wired), JetBrains Mono replaces Geist Mono** for the data/numbers role (§2.2), `font-variant-numeric: tabular-nums` utility class for score/salary/date cells. Both cover Cyrillic.

### D4. i18n: next-intl with `[locale]` segment and proxy.ts

`next-intl` with locale prefix routing: `app/[locale]/(dashboard)/...`. Locale negotiation (Accept-Language, cookie persistence) runs in **`proxy.ts`** — Next 16's rename of middleware; next-intl's documented middleware is mounted there. Messages in `apps/web/messages/{en,uk}.json`, flat keys namespaced by page (`jobs.filters.reset`). Dates/numbers/salary through next-intl's `Intl`-backed formatters. UI chrome only — LLM content and job data are never translated (§6).

- _Alternative considered:_ cookie-only locale without URL segment (single user, no SEO need). Rejected: the `[locale]` segment is next-intl's happy path for static rendering + typed navigation, and shareable URLs keep locale context.

### D5. Route and component structure

```
app/
  [locale]/
    (dashboard)/
      layout.tsx        ← sidebar + topbar shell (server; nav client islands)
      jobs/page.tsx     ← table (server shell + client table)
      jobs/[id]/page.tsx
      board/page.tsx
      sources/page.tsx
      dictionaries/page.tsx
      profile/page.tsx
      settings/llm/page.tsx
  proxy.ts (repo root of app), globals.css, layout.tsx (html/body + providers)
components/
  ui/          ← shadcn/ui primitives (generated, then owned)
  ScoreBadge, StageBadge, JobTable, FilterBar, BulkActionBar,
  JobDrawer, StageBoard, ReactionTimeline, DictEditor, ProviderCard,
  LocaleSwitch, ThemeToggle                       (per UI_DESIGN §9)
lib/
  api/         ← typed client + per-resource functions (jobs.ts, sources.ts, …)
  hooks/       ← useJobsQuery, useReactionMutation, useKeyboardNav, …
messages/{en,uk}.json
```

The **drawer vs full page** duality (§5.3): one `JobDetail` component rendered by both `JobDrawer` (Sheet, opened from the table via `?job=<id>` search param — survives refresh, Esc closes) and `jobs/[id]/page.tsx`. Route interception was considered and rejected: a search param is simpler, and ⌘-click already targets the real route for full page.

### D6. Jobs table: TanStack Table v8, manual server-side everything

Filtering/sorting/pagination are **manual** (server-driven): table state maps 1:1 to `GET /v1/jobs` query params (`sources`, `tags`, `remote`, `status`, `reaction`, `scoreMin/Max`, `salaryMin/Max`, `dateField`+`dateFrom`+`dateTo`, `query`, `limit`, `offset`). Row virtualization with `@tanstack/react-virtual` kicks in above 200 rows (§5.1). Row selection is TanStack row-selection state keyed by job id (string); bulk actions call `POST /v1/reactions/bulk` then invalidate the jobs query. Keyboard map (`j/k/x/Enter/a/r//`) implemented in a `useKeyboardNav` hook scoped to the table container, disabled while any input/dialog has focus; `?` opens the shortcuts dialog.

### D7. Kanban: dnd-kit over the reactions API

Board data comes from `GET /v1/jobs?reaction=<stage>` per column (the API filters on the `job_reaction_current` view). A drop posts `POST /v1/reactions {jobId, stage}`; the mutation is optimistic (move card immediately, roll back + sonner toast with undo on failure — undo posts the previous stage as a new event, consistent with the event-log model). Keyboard sensor + `aria-live` announcements per §8. Column bodies virtualized past 50 cards; Rejected column collapsed by default.

### D8. Contract gaps fixed in apps/api first (blocking prerequisite)

1. **Jobs list query params**: add explicit `@ApiQuery` decorators (or the Nest 11 `@ApiOkResponse`-style explicit metadata used in Phase 4 for bodies) so `ListJobsQueryDto` fields appear in OpenAPI; regenerate `shared-ts`.
2. **Cover letters**: `GET /v1/jobs/{id}/cover-letter` (200 with draft or 404) and `PUT /v1/jobs/{id}/cover-letter` (save edited body, `edited` flag per DATA_MODEL). Regeneration of drafts stays with the LLM service (out of scope for the UI beyond a disabled/`title`-hinted button if no endpoint exists — the "regenerate" button wires to the llm-service flow only if trivially proxied, else deferred to Phase 6 orchestration).
3. **Match explanation**: extend the job **detail** response (not the list) with `matchExplanation: string | null` read from `job_matches`, keeping the list payload lean.

All three are additive; client regeneration is a Phase-4-established script (`apps/api` emit-openapi + `packages/shared-ts` generate).

### D9. bigint ids stay strings end-to-end

Job ids are `string` in every layer of the web app (URL params, row selection keys, mutation payloads). No `parseInt`/`Number()` on ids anywhere — they can exceed `Number.MAX_SAFE_INTEGER`. `ReactionStage` and other unions come from `shared-ts`, not re-declared.

### D10. Error/loading states

- Route-level `loading.tsx` renders skeletons matching real layout (table skeleton rows, card grids) — no spinners in content areas, no shimmer loops longer than the load (§7).
- Route-level `error.tsx` per route group with retry; API client throws a typed `ApiError` (status + parsed body) that error boundaries and Query `onError` handlers render meaningfully.
- Mutations: sonner toasts (polite), destructive bulk actions get inline confirm, not a toast (§8).
- Empty states per §5.1: "no jobs yet" (points to Sources) vs "filters match nothing" (offers reset).

## Risks / Trade-offs

- **[Next 16 vs training-data Next 14/15 idioms]** → every Next-specific implementation step consults `node_modules/next/dist/docs/` first (async `params`/`searchParams`, `proxy.ts`, Tailwind v4 CSS-first, caching semantics). Tasks call this out explicitly.
- **[shadcn/ui + next-intl + next-themes compatibility with Next 16/React 19]** → these libraries track Next releases closely; verify versions at install time (first task of the skeleton milestone) and pin what works. If shadcn's CLI misbehaves with the Tailwind v4 + Next 16 combo, vendor the needed components manually (they are copy-in by design).
- **[Query-param serialization mismatch between web and API]** → comma-separated multi-values (`sources=1,3`) and ISO dates must match `ListJobsQueryDto` exactly; the regenerated client types (D8.1) plus one contract test against a running API in Playwright setup catch drift.
- **[Optimistic kanban vs event-log semantics]** → "undo" writes a compensating event rather than deleting; timeline shows both. Acceptable for a single-user tool; documented in the board spec.
- **[UA strings 15–30% longer breaking layouts]** → no fixed-width buttons, table cells truncate with tooltip; Playwright runs the happy path in `uk` as well as `en` (§6).
- **[Virtualization + real `<table>` semantics conflict]** → `@tanstack/react-virtual` with `<table>` needs row-height discipline (fixed 36px compact rows help); if semantics suffer, fall back to `role="table"` ARIA grid pattern — a11y gate (§8) wins over implementation convenience.
- **[Scope: 8 capabilities in one change]** → milestones in tasks.md are independently shippable (shell → jobs table → detail → board → admin pages); if the change must be split later, capability specs transfer as-is.

## Migration Plan

Greenfield UI; no data migration. Deployment is `npm run build` in the monorepo (turborepo). The `apps/api` additions (D8) ship first and are additive — no breaking change for other consumers. Rollback = revert commits; no persistent state involved beyond normal git history.

## Open Questions

- **Cover-letter regenerate button**: **Decided (Phase 5):** ship view/edit only; regenerate stays disabled with a tooltip. Regeneration remains with Phase 6 n8n / llm-service orchestration — no api-gateway proxy added in this change.
- **Global search (⌘K) scope**: UI_DESIGN shows it in the topbar; MVP interpretation = command palette for navigation + "search jobs" action that routes to `/jobs?query=…`. Full cross-entity search is not in the API and out of scope.
- **`nuqs` vs hand-rolled searchParams parsing** (D2) — **Decided:** hand-rolled `lib/jobs/search-params.ts` (small known param set; no extra dependency).
