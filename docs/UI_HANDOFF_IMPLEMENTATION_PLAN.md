# UI handoff implementation plan

Source: `design_handoff_job_hunter/` (`README.md`, `UI_DESIGN.md`, and six HTML references)
Target: `apps/web` plus the smallest API/data-contract changes required by the design
Baseline branch: `feat/ui-design-handoff-deltas` at `06db864`

## Outcome

Implement the handoff as a delta over the current application. The product already has the requested stack, tokens, locales, routes, API clients, table, board, detail view, and settings CRUD. Rebuilding those surfaces or copying the `.dc.html` prototypes would add risk without adding capability.

The remaining work is concentrated in four areas:

1. shell and responsive fidelity;
2. jobs-filter/table composition and state fidelity;
3. board data correctness at scale;
4. settings navigation and the two missing data contracts (provider telemetry and per-item dictionary enablement).

## Current-state assessment

| Area           | Reuse as-is                                                                                                                                           | Remaining delta                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation     | Tailwind v4 semantic tokens, dark/light themes, Material design axis, Geist/JetBrains fonts, EN/UK messages, shadcn primitives                        | Visual regression coverage; loading semantics                                                                                           |
| App shell      | Sidebar/topbar/nav counts, command palette, locale/theme/design controls                                                                              | 56px topbar, 248/64 manual collapse, 1024px behavior, exact brand/footer/content spacing, Jobs subtitle                                 |
| Jobs           | Filter-scoped summary counts, URL state, role-only full-text search, default posted sort, table, selection, keyboard flow, delete, pagination, drawer | Sticky compact filter bar, overflow popover, custom dates, table-header action placement, content-scoped bulk bar, exact loading layout |
| Board          | Five stages, keyboard/pointer DnD, optimistic mutation, rollback, persisted order, collapsed Rejected column, virtualization                          | True reaction age, source favicon, WIP hints, all-page loading/counts beyond 100 cards                                                  |
| Job detail     | Shared drawer/page component, fixed section order, match breakdown, timeline, cover-letter editing                                                    | Collapsed description preview, icon/focus polish, loading/error layout fidelity                                                         |
| Settings       | Provider/source/dictionary/profile CRUD and run history                                                                                               | Shared settings sub-navigation, neutral setting toggles, provider telemetry, per-item dictionary state                                  |
| States/dialogs | Separate empty states, command palette, shortcuts, named delete confirms                                                                              | Reusable layout-accurate jobs skeleton and focused accessibility checks                                                                 |

Current verification before implementation:

- web typecheck, lint, and 164 unit/component tests pass;
- API typecheck, lint, and 177 tests pass;
- lint reports only the existing React Compiler advisory warnings for TanStack Table/Virtual;
- live 1440px renders were compared with all six handoff references.

## Locked implementation decisions

- Do not copy prototype HTML, `support.js`, `ds-base.js`, or the published design-system bundle into production. Reuse the existing React components and semantic CSS variables.
- Do not add `DsPreviewProvider`; it is a prototype-bundle requirement. Production `ScoreBadge`, `StageBadge`, i18n, and tooltip providers already supply the required behavior.
- Keep the reconciliation strip on Jobs and the notification form on Profile. They are real product behavior absent from the reference mock.
- Keep current board failure semantics: failed moves auto-rollback; successful moves offer Undo. This satisfies the recovery intent more safely than asking the user to undo a failed request.
- Keep existing public URLs (`/jobs`, `/board`, `/sources`, `/dictionaries`, `/profile`, `/settings/llm`). Route groups/layouts may move files without changing URLs.
- Use existing dependencies. For custom date ranges, use two native date inputs inside the existing Popover; add a calendar package only if the native control proves unusable in the supported browser.
- Preserve the real dictionary kinds (`search`, `include`, `exclude`, `exclude_employer`, `alias`). Translate labels to user language, but do not invent a `nice-to-have` domain kind.
- Density toggle, saved filters, and charts remain out of scope as stated by the handoff.

## Implementation sequence

### 1. Shared shell and responsive frame — P0

Files:

- `apps/web/src/app/[locale]/(dashboard)/layout.tsx`
- new `apps/web/src/components/shell/dashboard-shell.tsx`
- `apps/web/src/components/shell/sidebar.tsx`
- `apps/web/src/components/shell/topbar.tsx`
- `apps/web/src/components/shell/sidebar.spec.tsx`
- `apps/web/messages/{en,uk}.json`

Changes:

1. Move the client-side shell composition into `DashboardShell`, which owns one `sidebarCollapsed` boolean and passes it to Sidebar and Topbar. Avoid a new global store/context for one local state.
2. Render the sidebar at 248px expanded and 64px collapsed. Force the rail at `<=1024px`; allow the topbar toggle above that breakpoint.
3. Match the reference frame: 56px topbar, 24px content gutter, 24px section rhythm, 280px search trigger on desktop, 18px page title.
4. Replace the large radar tile with the 8px accent brand mark from the handoff.
5. Show the real latest source run in the expanded footer by reusing `listSources` plus `getSourceRuns(slug, {limit: 1})` and selecting the newest result. This is intentionally an N+1 read for the current handful of sources; add a global latest-run endpoint only if source count makes it measurable.
6. For `/jobs`, reuse the Sidebar's cached `listJobs({limit: 1})` result to render `N roles · N unreviewed` in the topbar.

Acceptance:

- manual collapse works with mouse and keyboard and retains visible tooltips/labels;
- at 1024px the rail is 64px and content remains usable without horizontal page overflow;
- all topbar icon-only controls have localized `aria-label` and Tooltip content;
- Sidebar component tests cover expanded, collapsed, active route, and loading-count states.

### 2. Jobs dashboard fidelity — P0

Files:

- `apps/web/src/components/jobs/filter-bar.tsx`
- `apps/web/src/components/jobs/jobs-dashboard-summary.tsx`
- `apps/web/src/components/jobs/job-table.tsx`
- `apps/web/src/components/jobs/jobs-client.tsx`
- `apps/web/src/components/jobs/bulk-action-bar.tsx`
- `apps/web/src/app/[locale]/(dashboard)/jobs/loading.tsx`
- `apps/web/src/app/[locale]/(dashboard)/jobs/page.tsx`
- new `apps/web/src/components/jobs/jobs-loading-state.tsx`
- focused specs under `apps/web/src/components/jobs/`

Changes:

1. Restyle the summary as the handoff's four hairline-separated cells. Only High fit uses accent text. Keep the reconciliation strip as a secondary row.
2. Move “Open pipeline” from the summary into the table header beside Columns.
3. Make FilterBar sticky at the 56px topbar offset. Keep search/source/stage/tags/posted/score/remote in the primary wrapping row.
4. Put salary, date field, and custom From/To date inputs in a “More filters” Popover. Keep today/3d/7d/30d presets and URL round-tripping. Reset remains conditional on at least one active filter.
5. Preserve the existing role-identity search contract (title + company + summary, never description) and filter-scoped count query.
6. Change BulkActionBar from viewport-wide fixed positioning to a sticky bar inside the dashboard content column so it never overlays the sidebar. Preserve the two-step destructive confirms and Escape-to-clear behavior.
7. Add a polite selection-count live announcement; keep the implicit posted-desc sort exposed through `aria-sort="descending"`.
8. Extract one layout-accurate JobsLoadingState and reuse it for route loading and the Suspense fallback. Mark decorative skeleton blocks `aria-hidden` and expose one screen-reader loading status.

Acceptance:

- filter URLs survive refresh and drawer open/close;
- custom date endpoints are inclusive and serialize to the existing `dateFrom`/`dateTo` contract;
- active filters drive both the table and all four summary counts;
- 1024px layout moves secondary filters into More without clipping Ukrainian labels;
- Jobs unit tests cover More, custom dates, Reset visibility, selection announcement, and content-scoped bulk positioning.

### 3. Board correctness and fidelity — P0

Files:

- `apps/api/src/domain/job.model.ts`
- `apps/api/src/infrastructure/repositories/postgres-job.repository.ts`
- `apps/api/src/jobs/jobs.response.dto.ts`
- `apps/api/openapi.json`
- `packages/shared-ts/src/generated/api.ts`
- `apps/web/src/components/board/stage-board.tsx`
- `apps/web/src/components/board/stage-column.tsx`
- `apps/web/src/components/board/stage-card.tsx`
- board repository/component/performance specs

Changes:

1. Expose `currentReactionAt` from the existing `core.job_reaction_current.occurred_at` column. No migration is required. Map it through the Job domain model, response DTO, OpenAPI, and generated shared types.
2. Compute days-in-stage from `currentReactionAt`; retain `firstSeenAt` only as a legacy fallback when the timestamp is absent.
3. Replace the single `limit: 100` request per column with a small `listAllBoardJobs` loop over the existing paginated endpoint. Load pages until `items.length === total`, then feed the existing virtualizer. This avoids a new board endpoint. Ponytail ceiling: switch to true incremental column paging only if active columns regularly exceed roughly 500 cards.
4. Render the API `total` in the column header, not the currently loaded array length.
5. Add translated WIP hints in column headers and derive a source favicon from the job URL at runtime, with a silent text fallback when it fails.
6. Keep the current optimized DnD/collision/order code. Add only the metadata and pagination changes; do not rewrite the board.

Acceptance:

- a reaction moved today displays 0 days regardless of job discovery date;
- a stage with 101+ jobs displays and counts every card;
- keyboard lift/move/drop/cancel and live announcements still pass;
- pointer drag render-count performance remains bounded by the existing performance specs;
- deleting a card remains confirmed, non-optimistic, and isolated from drag handling.

### 4. Detail and states polish — P1

Files:

- `apps/web/src/components/jobs/job-detail.tsx`
- `apps/web/src/components/jobs/job-drawer.tsx`
- `apps/web/src/components/jobs/cover-letter-editor.tsx`
- `apps/web/src/components/ui/skeleton.tsx`
- relevant job-detail specs and Playwright flows

Changes:

1. Show a clamped, safe plain-text description preview while collapsed; Expand reveals the full source text. Keep text rendering rather than introducing an HTML/Markdown parser solely for typography.
2. Replace text glyph toggles with Lucide chevrons and preserve `aria-expanded`.
3. Match the 560px/200ms drawer and pinned footer in both motion modes; reduced motion removes the slide.
4. Align detail loading/error blocks to the real section geometry and ensure the six-section DOM order is also the tab order.
5. Keep dirty cover-letter confirmation and non-clobbering regenerate behavior.

Acceptance:

- long descriptions do not create layout jumps and never execute source markup;
- drawer and full-page detail render the same data/section order;
- keyboard focus returns to the originating row when the drawer closes;
- dirty cover-letter edits cannot be discarded silently.

### 5. Settings cluster and provider telemetry — P1

Files:

- move the four route pages under a `(settings)` route group and add its `layout.tsx`
- new `apps/web/src/components/settings/settings-nav.tsx`
- `apps/web/src/components/llm/provider-card.tsx`
- `apps/web/src/components/llm/llm-settings-page.tsx`
- `apps/web/src/components/sources/sources-page.tsx`
- `apps/web/src/components/profile/profile-form.tsx`
- `services/llm/src/llm/{api.py,db.py,routes.py}`
- Nest LLM domain/client/response files, OpenAPI, and generated shared types

Changes:

1. Add one shared 220px Settings sub-navigation for LLM providers, Sources, Dictionaries, and Profile without changing their URLs.
2. Apply the handoff's content widths and one-column fallback below desktop.
3. Make settings switches visually neutral when checked via local class overrides; retain accent for action buttons and active navigation.
4. Aggregate existing `llm.pipeline_runs` by provider in the LLM service: p50/p95 latency, failed runs in the last 24h, last status, and last run time. Return it with provider rows and propagate it through the Nest gateway.
5. Derive health presentation from data: muted = no runs, green = most recent success, warning/destructive = most recent failure. Always include a text label; never color alone.
6. Keep connection-test feedback inline and active-provider switching confirmed.

Acceptance:

- the four routes share the same sub-nav and active state in EN and UK;
- provider cards never fabricate telemetry; “no runs recorded” is explicit;
- Sources still exposes CRUD, connectivity test, Run now, reconciliation, and run history;
- setting toggles are neutral while enabled and remain accessible by name.

### 6. Per-item dictionary enablement — P1, separate data slice

This is not a styling task: the current schema stores plain strings/alias pairs and supports only dictionary-level enablement. Implement it separately so the UI cannot promise state that consumers ignore.

Files:

- new migration adding `disabled_items text[] NOT NULL DEFAULT '{}'` to `core.keyword_dictionaries`
- `infra/db/schema.sql`
- keyword-dictionary domain, repository, DTO, response, OpenAPI, and generated types
- `apps/api/src/keyword-dictionaries/dictionary-filters.ts`
- `services/scraper/src/scraper/{db.py,queries.py,filters.py}`
- `apps/web/src/components/dictionaries/dict-editor.tsx`
- API/scraper/web tests

Changes:

1. Store disabled list values directly and disabled alias keys in `disabled_items`; do not reshape the existing `items` JSON and break old consumers.
2. Expose `disabledItems` in create/update/read contracts.
3. Filter disabled values in both gateway rules and scraper query/filter construction.
4. Render a neutral per-item Switch and disabled badge treatment. Removing an item also removes it from `disabled_items` in the same update.
5. Keep dictionary-level enablement as the coarse master switch.

Acceptance:

- disabling an item changes subsequent search/filter behavior without deleting it;
- aliases use their key as the disabled identifier;
- old rows migrate to all items enabled;
- API, scraper, and UI agree on the effective item set.

### 7. Fidelity and accessibility gate — P0 before merge

1. Add deterministic Playwright fixtures by intercepting the existing `/api` proxy; do not depend on mutable local database counts for screenshots.
2. Capture the minimum useful visual set:
   - dark EN at 1440px: Jobs, Board, Job detail, Settings;
   - light UK at 1024px: Jobs and Settings;
   - collapsed shell at 1024px.
3. Exercise keyboard-only paths: shell toggle, filter bar, table `j/k/x/Enter/a/r`, bulk bar, drawer, command palette, board DnD, settings sub-nav.
4. Assert localized accessible names, `aria-sort`, live-region messages, dialog dismissal, and reduced-motion behavior.
5. Run the full repository gates affected by each slice:

```powershell
cd E:\job-hunter\apps\api
npm run openapi:emit
npm run typecheck
npm run lint
npm run test

cd E:\job-hunter\packages\shared-ts
npm run generate
npm run typecheck
npm run lint
npm run build

cd E:\job-hunter\services\llm
uv run pytest -q
uv run ruff check .
uv run mypy --strict src

cd E:\job-hunter\services\scraper
uv run pytest -q
uv run ruff check .
uv run mypy --strict src

cd E:\job-hunter\apps\web
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Recommended delivery slices

1. Shell + Jobs fidelity.
2. Board reaction timestamp + complete column loading.
3. Detail + settings shell.
4. Provider telemetry.
5. Per-item dictionary enablement.
6. Cross-theme/locale visual and accessibility gate.

Each slice should be independently shippable and preserve the current passing baseline. Do not combine the dictionary schema change with visual-only work.
