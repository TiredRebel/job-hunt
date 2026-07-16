# Tasks — Phase 5 Web app (NextJS dashboard)

Quality gate (repeated at each ✋ checkpoint): `npm run typecheck && npm run lint && npm run test` in the touched workspaces plus `npm run build` in `apps/web`. Web code must satisfy TSDoc-on-exports lint and the strict TS extras.

## 1. API contract prerequisites (apps/api + shared-ts)

- [x] 1.1 Add explicit `@ApiQuery` metadata for every `ListJobsQueryDto` field on `GET /v1/jobs` so filters/pagination appear in OpenAPI (verify: emitted `openapi.json` lists all query params)
- [x] 1.2 Expose `matchExplanation: string | null` on the job detail response (read from `job_matches`; list response unchanged) + unit test
- [x] 1.3 Add `GET /v1/jobs/{id}/cover-letter` (200 draft / 404 none) and `PUT /v1/jobs/{id}/cover-letter` (save edited body, set edited flag) with response DTOs + unit tests
- [x] 1.4 Regenerate `packages/shared-ts` client; verify `JobsController_list_v1` now has typed `query` and new operations exist; all api/shared-ts gates green ✋

## 2. Web skeleton: deps, tokens, theming

- [x] 2.1 Read `node_modules/next/dist/docs/01-app/01-getting-started/` guides (async params/searchParams, proxy.ts, CSS, fonts) — capture any deviations from this plan before coding
- [x] 2.2 Install deps in `apps/web`: `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-virtual`, `@dnd-kit/core`, `next-themes`, `next-intl`, `lucide-react`, `sonner`, `zod`; init shadcn/ui (Tailwind v4 mode) and add the §9 component inventory; verify Next 16 + React 19 compatibility of each
- [x] 2.3 Align `apps/web` tsconfig/eslint with repo standards (strict extras, eslint-plugin-jsdoc TSDoc rules, path aliases) and add `typecheck`/`test` scripts wired into turbo
- [x] 2.4 Implement UI_DESIGN §2.1 tokens in `globals.css` (`:root` + `.dark` + `@theme inline` mapping), typography scale, JetBrains Mono via next/font with `tabular-nums` utility
- [x] 2.5 Wire `next-themes` (class attribute, system default, no-flash) and build `ThemeToggle` (light/dark/system three-state)
- [x] 2.6 Set up next-intl: `[locale]` segment, `proxy.ts` locale negotiation + cookie persistence, `messages/{en,uk}.json` scaffolding, `LocaleSwitch`; locale-aware date/number formatters ✋

## 3. App shell and API client layer

- [x] 3.1 Build the dashboard layout: sidebar (232px/56px collapse, active state, tooltips) + topbar (page title, ⌘K trigger, locale switch, theme toggle) as the `(dashboard)` route group layout
- [x] 3.2 Typed API client in `lib/api/`: fetch wrapper inferring params/body/response from `ApiPaths`/`ApiOperations`, zod-validated env config (`API_URL`/`NEXT_PUBLIC_API_URL`), typed `ApiError`; unit tests (Vitest) for URL/query building incl. comma-joined multi-values and ISO dates
- [x] 3.3 Per-resource API functions (jobs, reactions, profiles, dictionaries, llm, sources) + TanStack Query provider in the root layout; ids stay `string` everywhere
- [x] 3.4 Command palette (⌘K): navigation entries + "search jobs" routing to `/jobs?query=…`
- [x] 3.5 Route-level `loading.tsx` skeleton + `error.tsx` boundary pattern for the dashboard group; sonner toaster mounted ✋

## 4. Jobs dashboard (`/jobs`)

- [x] 4.1 Server page: `await searchParams` → parse/validate filter params → fetch page 1 server-side → hydrate client table with `initialData`
- [x] 4.2 `JobTable` (TanStack Table, manual mode): §5.1 column set, sortable score/posted/salary with `aria-sort`, column-visibility menu, 36px rows, `ScoreBadge`/`StageBadge` components
- [x] 4.3 Virtualize rows above 200 with `@tanstack/react-virtual`, preserving `<table>` semantics (fall back to ARIA grid pattern only if semantics break)
- [x] 4.4 `FilterBar`: search, source/stage multi-selects, tags combobox, score slider, remote switch, salary min, date-range picker (presets + `dateField` selector); URL-encoded state, removable chips, conditional Reset
- [x] 4.5 Bulk selection + `BulkActionBar` (bottom bar, count, stage actions, inline confirm for Reject) → `POST /v1/reactions/bulk` → invalidate jobs query; Esc clears selection
- [x] 4.6 `useKeyboardNav` hook: `j/k/x/Enter/a/r//` scoped to table, disabled in inputs/dialogs; `?` shortcuts help dialog
- [x] 4.7 Both §5.1 empty states; EN+UK messages for everything added ✋

## 5. Job detail (drawer + `/jobs/[id]`)

- [x] 5.1 `JobDetail` component with the §5.3 fixed section order; graceful placeholders for missing LLM data; match explanation section
- [x] 5.2 `JobDrawer` (Sheet 560px) driven by a `?job=<id>` search param (survives refresh, Esc closes); row click opens drawer, ⌘/Ctrl-click navigates to full page; `/jobs/[id]` page (`await params`) renders the same component
- [x] 5.3 Stage select + footer stage buttons → `POST /v1/reactions`, optimistic badge update, timeline refresh
- [x] 5.4 `ReactionTimeline` from `GET /v1/reactions/{jobId}/timeline` (mono timestamps, locale-formatted)
- [x] 5.5 Cover-letter viewer/editor: textarea + save via `PUT /v1/jobs/{id}/cover-letter`, dirty-state guard on close, placeholder when no draft; decide regenerate-button wiring (design open question) and document the outcome ✋

## 6. Stage board (`/board`)

- [x] 6.1 `StageBoard` with five columns from per-stage jobs queries; card layout (≤64px), counts in headers, Rejected collapsed by default
- [x] 6.2 dnd-kit drag & drop: drop → optimistic move + `POST /v1/reactions`; rollback + undo toast on failure; undo appends compensating event
- [x] 6.3 Keyboard sensor + `aria-live` move announcements; virtualize column bodies past 50 cards ✋

## 7. Admin pages

- [x] 7.1 `/sources`: source rows (enable switch → `PATCH /{slug}/enabled`, cron with human-readable hint, last-run status), "Run now" → `POST /{slug}/scrape`, run-history table from `GET /{slug}/runs`
- [x] 7.2 `/dictionaries`: `DictEditor` per kind — inline add row, tag-style edit, per-item enable switch, delete with inline confirm, API-error display
- [x] 7.3 `/profile`: active-profile form (skills/seniority/salary/locations/remote/stop-words tag inputs), inline validation, dirty-state navigation guard, reset
- [x] 7.4 `/settings/llm`: `ProviderCard` grid, active radio + one-click confirm switch → `PUT /providers/active` with rollback on failure, inline "Test connection" result → `POST /providers/test-connection` ✋

## 8. Quality gates, e2e, wrap-up

- [x] 8.1 A11y pass per §8: AA contrast both themes (incl. badges), full keyboard path filter bar → table → bulk bar → drawer, focus-visible rings, tooltips/aria-labels on icon buttons in both locales, `prefers-reduced-motion`
- [x] 8.2 Wire Playwright in `apps/web` (dev server against a seeded local API); happy-path e2e: jobs list → filter (incl. date range) → open drawer → mark applied → board shows the card; run in `en` and `uk`
- [x] 8.3 i18n sweep: no hardcoded UI strings, UA layout tolerance verified; token sweep: no hex literals or `dark:` color overrides in components
- [x] 8.4 Full monorepo gates green (`typecheck`, `lint`, `test`, `next build`); update PROGRESS.md Phase 5 checkboxes + log entry; wiki checkpoint ✋
