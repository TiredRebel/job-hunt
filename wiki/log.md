# Log — append-only

## [2026-07-15] ingest | Wiki bootstrapped (Karpathy llm-wiki pattern)

Instantiated schema (CLAUDE.md), index, log. Seed-ingested PROGRESS.md,
docs/ARCHITECTURE.md, docs/DECISIONS.md → wrote project-overview,
architecture, decisions pages. Remaining docs catalogued as raw sources
in index.md.

## [2026-07-15] checkpoint | Phase 0 complete, Phase 1 (DB & migrations) next

Monorepo bootstrapped and committed; all design docs composed; jobhunter DB
created in pg-learn. See pages/current-state.md for resume details.

## [2026-07-15] ingest | Graphify code knowledge graph built

`graphify update .` (v0.9.6, local AST pass, no LLM) → `../graphify-out/`:
graph.html (interactive), GRAPH_REPORT.md, graph.json. 372 nodes, 348 edges,
41 communities, 100% EXTRACTED, from commit badce609. Restore aid: use
`graphify explain "Node"` / `graphify path "A" "B"` to navigate code structure;
refresh with `graphify update .` after code changes (free). Semantic doc pass
and `--wiki`/`--obsidian` export remain optional upgrades.

## [2026-07-15] checkpoint | Phase 2 scraper service complete (commit 6b24cdc)

PoliteClient (robots.txt, throttle+jitter, FetchBlockedError, no bot evasion),
5 adapters (dou.ua, work.ua, job.ua, Reddit JSON, Upwork RSS best-effort),
fingerprint dedup + incremental runs, REST POST /scrape/{source} + GET /runs.
25 fixture-based tests, ruff + mypy --strict green. Deferred: crawl4ai +
agent-browser fallback for JS-heavy pages. Next: Phase 3 (LLM service).
Graphify graph now stale — refresh before relying on it.

## [2026-07-15] checkpoint | Phase 3 LLM service complete, routes refactored (commit 63b8a59)

Provider hub (ollama-local/cloud, openai-compatible, anthropic), DB-driven
hot-switch with LISTEN/NOTIFY cache invalidation, LangGraph pipelines
(normalize/extract → summarize/tags/red-flags → match 0–100 → cover-letter),
REST endpoints wired. `63b8a59` extracts routes into `llm.routes` APIRouter
so `llm.main` remains app factory/lifespan only. 27 tests green, ruff +
mypy --strict clean. Wiki current-state updated; graphify still stale.
Repo at clean checkpoint awaiting next phase selection.

## [2026-07-16] checkpoint | Phase 4 API gateway skeleton + domain APIs done

`apps/api` bootstrapped with Clean Architecture modules and pino logging.
Bounded contexts: jobs (list/filter/search/detail/status), keyword-dictionaries
(CRUD), reactions (single + bulk + timeline), profiles (CRUD + active),
llm-admin (providers list/switch/test), sources (list/toggle/trigger/runs).
Postgres repositories + HTTP clients for scraper/LLM. Typecheck + lint green;
existing Vitest passes. Open: unit tests, OpenAPI client generation in
`packages/shared-ts`, re-run LLM quality gates, commit. Wiki current-state
updated.

## [2026-07-16] checkpoint | Phase 4 unit tests + OpenAPI TS client (commits 4db1252, eee7b50)

40 unit tests across jobs/reactions/profiles/sources/keyword-dictionaries/
llm-admin using in-memory repository fakes (`4db1252`). LLM quality gates
re-confirmed: 28/28 pytest, ruff, mypy --strict green. OpenAPI TS client
generated in `packages/shared-ts` (`eee7b50`): `apps/api/scripts/emit-openapi.ts`
dumps `openapi.json` without booting HTTP; `openapi-typescript` →
`src/generated/api.ts`, re-exported as `ApiPaths`/`ApiOperations`; shared-ts
got its own eslint flat config (generated file ignored). Typecheck/lint/build
green. Next: enrich OpenAPI schemas with `@ApiProperty`/response DTOs, then
regenerate.

## [2026-07-16] checkpoint | Phase 4 complete — OpenAPI schema enrichment (commit 21b2f40)

Response DTOs (`*.response.dto.ts`) added across all 7 modules; controllers
annotated with `@ApiOkResponse`/`@ApiCreatedResponse`. Key gotcha: the emit
script runs via tsx (esbuild), which emits no `design:paramtypes` metadata,
so `@Body()` request DTOs were silently missing from the spec — fixed with
explicit `@ApiBody({ type })` on all 9 body-bearing handlers. Spec now has
28 named schemas (0 unreferenced); `packages/shared-ts` client regenerated.
Gates: tsc, eslint, 40/40 vitest, shared-ts build all green. Known gaps:
bigint ids as `string`, delete/bulk-count endpoints inline primitives,
concrete per-resource pagination wrappers. PROGRESS.md Phase 4 checklist
fully checked; wiki current-state updated. Phase 4 done — next phase open
(Phase 5 web app or Phase 2 crawl4ai leftover).

## [2026-07-16] checkpoint | Phase 4 response polish — bigint serializer, common DTOs, pagination mixin (commit b3ada85)

Closed the three known gaps from `21b2f40`: global `BigIntSerializerInterceptor`
(`APP_INTERCEPTOR`) recursively stringifies bigints before JSON serialization
(Dates preserved for native ISO output; 6 unit tests); named
`DeletedResponse`/`BulkInsertedResponse` in `src/common/common.response.dto.ts`
replace bare Boolean/Number on profiles + keyword-dictionaries `DELETE` and
`POST /reactions/bulk`; `PaginatedResponse(Item)` mixin in
`src/common/paginated.response.ts` deduplicates the pagination wrapper shape
(`PaginatedJobsResponse` now extends it). Spec regenerated: 30 named schemas
(+2), 0 unreferenced, 9 `@ApiBody` request bodies intact; shared-ts client
regenerated. Gates: api tsc/eslint/46 vitest green; shared-ts tsc/eslint/build
green. Phase 4 header flipped to ✅ in PROGRESS.md. Next phase still open
(Phase 5 web app or Phase 2 crawl4ai leftover).

## [2026-07-16] checkpoint | Phase 5 web dashboard complete (OpenSpec 38/38)

Phase 5 Next.js dashboard finished under openspec/changes/phase-5-web-dashboard:
jobs table + filters/bulk/keyboard, job detail drawer/page (timeline, cover-letter
view/edit; regenerate deferred), stage board dnd, admin pages (sources,
dictionaries, profile, LLM), Playwright e2e wired with API-skip. apps/web
typecheck/lint/test/build green. PROGRESS Phase 5 flipped to complete. Ready
to archive the OpenSpec change; next is Phase 6 n8n or Phase 2 crawl4ai leftover.

## [2026-07-16] ingest | Graphify graph refreshed (post-Phase 5)

`graphify update .` (local AST pass, no LLM): 2198 nodes, 4129 edges,
128 communities across 323 files — replaces the stale 372-node bootstrap
graph. Curated graph backed up to `2026-07-16/` inside graphify-out.
Removed the refresh item from current-state next-ups.

## [2026-07-16] checkpoint | Phase 5 OpenSpec change archived, specs synced

Delta specs from `phase-5-web-dashboard` synced into main `openspec/specs/`
as 8 new capability specs (web-app-shell 6, jobs-dashboard 5, job-detail 4,
llm-admin-ui 3, sources-admin 3, stage-board 3, dictionaries-editor 2,
profile-editor 2 — 28 requirements; `openspec validate --all` 9/9). Change
moved to `openspec/changes/archive/2026-07-16-phase-5-web-dashboard/`.
Graphify refreshed earlier today. Next phase open: 6 (n8n) or 2 (crawl4ai).
