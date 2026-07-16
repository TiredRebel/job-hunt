# Phase 5 — Web app (NextJS dashboard)

## Why

Phases 0–4 delivered the entire backend: data model, scraper, LLM pipelines, and a NestJS API gateway with a typed OpenAPI client in `packages/shared-ts`. The system already scrapes, normalizes, scores and drafts cover letters for vacancies — but there is no user-facing surface to triage them. Phase 5 builds the dashboard UI in `apps/web` (currently the untouched create-next-app skeleton), following the locked design spec in `docs/UI_DESIGN.md`.

## What Changes

- Build out `apps/web` from the bare skeleton into the job-hunting dashboard: app shell (sidebar + topbar), design tokens (hunter-green, dark-first dark/light themes via `next-themes`), EN+UA i18n (`next-intl`), shadcn/ui component base.
- **Jobs dashboard** (`/jobs`): dense TanStack Table (virtualized) with filter bar — full-text search, source/stage/tags multi-selects, score & salary ranges, remote switch, date-range picker bound to the API's `dateField`/`dateFrom`/`dateTo` params; bulk row selection with stage actions; keyboard navigation.
- **Job detail** (right drawer + `/jobs/[id]` full page): LLM summary, tech-stack tags, red flags, match score & explanation, sanitized description, reaction timeline, cover-letter viewer/editor.
- **Board** (`/board`): stage kanban (Saved/Applied/Interview/Offer/Rejected) with dnd-kit drag & drop posting reaction events.
- **Settings cluster**: `/settings/llm` (provider list, active switch, test connection), `/sources` (enable/disable, trigger scrape, run history), `/dictionaries` (per-kind keyword dictionary CRUD), `/profile` (skills/seniority/salary/locations editor).
- All data flows through the generated `packages/shared-ts` client against `apps/api` — no direct DB access, no raw third-party fetches from components.
- **Supporting API-contract fixes** (small `apps/api` + client regeneration work this change depends on):
  - `GET /v1/jobs` query parameters (filters, pagination) are missing from the OpenAPI spec — the generated client shows `query?: never`. Add explicit `@ApiQuery` metadata and regenerate.
  - No cover-letter endpoints exist; add `GET/PUT /v1/jobs/{id}/cover-letter` (read + edit draft) to serve UI_DESIGN §5.3.6.
  - Job detail lacks the match explanation (UI_DESIGN §5.3.3); expose it on the detail response or a `/jobs/{id}/match` endpoint.
- Playwright e2e wired for the web happy path (per ARCHITECTURE §10), run in both locales.

Non-goals (per UI_DESIGN §11): density toggle, saved filter presets, charts, mobile-first layouts. Notifications UI is Phase 6.

## Capabilities

### New Capabilities

- `web-app-shell`: app layout (sidebar/topbar), navigation, theming tokens + dark/light toggle, EN+UA locale switching, global search (⌘K), accessibility and motion baselines.
- `jobs-dashboard`: `/jobs` filterable/sortable/virtualized jobs table, filter bar with date-range picker, bulk stage actions, keyboard flow, empty states.
- `job-detail`: job drawer + full page — summary, tags, red flags, match score/explanation, description, reaction timeline, cover-letter view/edit, stage actions.
- `stage-board`: `/board` kanban over reaction stages with drag & drop (pointer + keyboard) creating reaction events, optimistic updates.
- `sources-admin`: `/sources` page — enable/disable sources, schedule display, trigger scrape, run history.
- `dictionaries-editor`: `/dictionaries` page — CRUD over keyword dictionaries per kind (search/stop-words/must-have/nice-to-have/aliases).
- `profile-editor`: `/profile` page — edit skills, seniority, salary expectations, locations, stop-words.
- `llm-admin-ui`: `/settings/llm` page — provider cards, one-click active-provider switch with confirm, connection test.

### Modified Capabilities

None — this is the first OpenSpec change in the repo; no existing specs in `openspec/specs/`.

## Impact

- **`apps/web`** — main body of work: App Router routes, components, styles, i18n messages, Playwright tests. Note: the installed framework is **Next 16.2.10** (React 19.2, Tailwind v4 CSS-first config), not Next 15 as older docs say — implementation follows `node_modules/next/dist/docs/`.
- **`apps/api`** — small additive changes: OpenAPI query-param metadata on jobs list, cover-letter endpoints, match explanation exposure; unit tests for new endpoints.
- **`packages/shared-ts`** — client regenerated after API spec fixes (consumers unaffected: additive).
- **Dependencies added to `apps/web`**: shadcn/ui (+ Radix), TanStack Table v8, `@tanstack/react-virtual`, `@dnd-kit/core`, `next-themes`, `next-intl`, `lucide-react`, `sonner`, Playwright (dev).
- **Docs/process**: PROGRESS.md Phase 5 checkboxes + log entry on completion; quality gates are the repo standard (`typecheck`, `lint` incl. TSDoc-on-exports, tests, `next build`).
