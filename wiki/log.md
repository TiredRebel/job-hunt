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

## [2026-07-16] checkpoint | Phase 6 n8n workflows complete (OpenSpec 26/26)

Gateway `automation` module (unprocessed-jobs feed, transactional result
persistence, notification dedup ledger, digest + watermark), scraper
additions respecting schema ownership (`GET /jobs_raw/unprocessed`,
`POST /jobs_raw/{id}/mark`, new `title` column), cover-letter regeneration
closing the Phase 5 deferral, and four n8n workflows hand-authored and
schema-validated via real `n8n import:workflow` against the running
instance (exported to `n8n/workflows/*.json` + README). Fixed a pre-existing
bug along the way: `POST /scrape/{slug}` never returned `runId`, silently
broken since Phase 4. Migrations 0006/0007. All gates green across every
service (llm/scraper pytest+ruff+mypy, api/shared-ts/web tsc+eslint+test
+build). PROGRESS.md Phase 6 flipped to ✅. OpenSpec change not yet
archived. Next: archive the change, then Phase 2 crawl4ai leftover or
Phase 7 hardening.

## [2026-07-16] checkpoint | Phase 2 crawl4ai/agent-browser leftover complete (OpenSpec 20/20)

`core.sources.fetch_strategy` finally drives real fetcher selection —
previously seeded but ignored. New `scraper/fetchers/` package: `PageFetcher`
port, shared `PolitenessGate` (robots + per-domain pacing across every
transport), `HttpxFetcher` (renamed from `PoliteClient`), `EscalatingFetcher`
(HTTP-first, JS-shell escalation, never escalates blocked responses),
`Crawl4aiFetcher` (optional dep, lazy browser, raw rendered HTML),
`AgentBrowserFetcher` (config-driven subprocess seam). Safety correction
found and closed before coding the last piece: the JS-shell heuristic can't
tell a legitimate SPA from a Cloudflare-style challenge page, so
`anti_bot.py` detects known interstitial markers and blocks rather than
escalates — closing a real bot-detection-evasion risk on Upwork. Research
note: agent-browser's exact CLI contract couldn't be verified without
installing it onto the user's machine (judged too invasive to do
unilaterally), so `AgentBrowserFetcher`'s command and output parsing are
fully configurable/defensive rather than hard-coded to one guessed shape.
Gates: scraper 71/71 pytest (+1 skipped live-smoke) + ruff + format + mypy
--strict, all green; confirmed the service boots with crawl4ai absent. Live
scrape smoke blocked by the same pre-existing Windows/psycopg issue found
in Phase 6 (deferred to WSL/Docker). PROGRESS.md Phase 2 flipped to ✅.
OpenSpec change not yet archived. Next: archive both open changes
(phase-2-crawl4ai-fetch-ladder, phase-6-n8n-workflows), then Phase 7
hardening.

## [2026-07-16] ingest | Graphify graph refreshed (post-Phase 2 + archives)

`graphify update .` (local AST pass, no LLM): 2911 nodes, 5226 edges, 174
communities across 388 files — up from 2198/4129/128, now covering the
Phase 2 crawl4ai/agent-browser fetch ladder and the archived OpenSpec
changes. Curated graph backed up to `2026-07-16/` inside graphify-out.
Removed the refresh item from current-state next-ups; also corrected the
current-state snapshot to reflect all three OpenSpec changes (phase-5,
phase-6, phase-2) now archived, with only phase-2's archive move still
uncommitted.

## [2026-07-17] checkpoint | Docker/CI stood up, sources-page-crud implemented

Full Docker stack now runs for real (Dockerfiles for all 4 services, compose
extended, CI workflow added) — docs/DEPLOYMENT.md documents it, several real
gaps found and fixed along the way (see PROGRESS.md log). Brought the stack
up live and, while checking the admin pages, found and fixed a genuinely
pre-existing bug: the gateway never called `app.enableCors()`, breaking every
browser-side fetch regardless of Docker. OpenSpec `sources-page-crud`
proposed and fully implemented (add/edit/test-connectivity on `/sources`),
verified against the live stack with real browser automation and real
network calls, not archived yet. See pages/current-state.md for full detail
and resume commands.

## [2026-07-17] checkpoint | llm-settings-config implemented + verified live; sources-page-crud archived

`sources-page-crud` archived (move + spec sync both done, not yet committed).
New OpenSpec change `llm-settings-config` fully implemented across all 5 task
groups: services/llm gained a real per-provider `POST
/providers/{slug}/test` (replacing the old endpoint, which only checked the
LLM service's own `/health` and never the actual provider — a genuinely fake
"Test connection" button, discovered while scoping this change), live model
listing, provider creation, and a configuration PATCH with NOTIFY-based
hot-reload; the gateway and web layers were extended to match, with a new
`LlmServiceError` class threading real HTTP status codes through to NestJS
exceptions (404/409/422→400/502), and two new web dialogs (`provider-form-
dialog`, `provider-config-dialog`) following the established
`SourceFormDialog` outer-stateless-plus-keyed-inner-form pattern, including a
small local cmdk-based model combobox with free-text fallback. All gates
green (services/llm 57 pytest, apps/api 99 vitest, apps/web 53 vitest, all
typecheck/lint/build clean across every package). Rebuilt and restarted the
Docker stack, then verified live via real browser automation: created a real
`groq-test` provider, observed four genuine test outcomes (`ConnectError`,
a real `HTTPStatusError` 401 from Groq's actual API, a missing-API-key
message, and a real `ok: true` with measured latency after fixing
`ollama-local`'s base URL to `host.docker.internal`), and proved the
omitted-vs-explicit-null `apiKeyEnv` PATCH distinction survives a real HTTP
round-trip via a raw curl request (a case advisor flagged as unprovable by
unit tests alone). Not archived yet — left `groq-test` and the
`ollama-local` base-url fix in the live DB (the latter a genuine fix, not
debris). See pages/current-state.md for full detail and resume commands.

## [2026-07-18] checkpoint | Live-smoke bugfix round: same-origin /api proxy, raw_html fix, TagsInput a11y fix

Resumed from the 2026-07-17 llm-settings-config checkpoint after a context restore. Found three uncommitted, already-implemented fixes in the working tree from earlier work not yet logged: (1) direct browser→gateway CORS fetches replaced with a same-origin `apps/web/src/app/api/[...path]/route.ts` proxy — `env.ts`, `main.ts` (comma-separated `WEB_ORIGIN`), both Dockerfiles, `docker-compose.yml`, all `.env.example` files, and `DEPLOYMENT.md` updated in lockstep; (2) `scraper/adapters/_html.py::build_posting()` was storing full raw HTML in `raw_html` instead of the already-extracted description text, degrading LLM normalize output; (3) `TagsInput` wasn't forwarding `id`, breaking the Profile page's `Label htmlFor="skills"` association. Ran all four services' gates (scraper 80/80 pytest + ruff + mypy, llm 57/57 pytest + ruff + mypy, api 99/99 vitest + tsc + eslint + build, web 53/53 vitest + tsc + eslint + build) — all green, no regressions. Rebuilt and redeployed the Docker stack. Verified the proxy fix live via curl (GET `/api/sources` byte-identical to the direct gateway call; a real POST `/api/sources/dou/test` round-tripped a genuine network fetch through the proxy) since real browser automation (Playwright/chrome-devtools MCP) was unavailable in this environment — no reachable Chrome binary. Updated `pages/current-state.md` and `PROGRESS.md`'s dated log with full detail. Not committed — awaiting explicit user go-ahead per this repo's git-workflow convention.

## [2026-07-18] checkpoint | llm-provider-delete-and-model-picker: provider delete + model combobox rebuild, verified live

User reported the LLM Settings Configure dialog's model dropdown was broken (click didn't apply, list unbrowsable once a value was saved, unlisted models accepted silently) and asked for a plan covering: removing the stuck `groq-test` row, a real Ollama model dropdown, fixing the selection bug, and adding a Delete button. Ran the full OpenSpec cycle: `/opsx:archive` first (llm-settings-config archived, delta synced into `openspec/specs/llm-admin-ui/spec.md`), then `/opsx:propose` (proposal/design/specs/tasks, 23 tasks across 4 groups) and `/opsx:apply` (full implementation). Root cause of the combobox bug: the old widget used an editable `<Input>` as the popover trigger — selecting an item returned focus to the input, which reopened the popover, making clicks look like they did nothing; and filtering was driven by the _saved_ value, so a configured provider showed an empty/wrong-filtered list on open. Rebuilt as the canonical shadcn/cmdk button-trigger + popover-search combobox, which structurally can't have either bug. Added end-to-end provider deletion (`DELETE /providers/{slug}` on the LLM service, gateway proxy, `deleteLlmProvider` client, destructive Delete button in the Configure dialog) — 404 unknown slug, 409 active provider, no NOTIFY needed. Gates green throughout (services/llm 61/61, api 102/102, web 56/56, all lint/typecheck/build clean). Rebuilt and redeployed the Docker stack; verified live via curl (same no-Chrome-binary limitation as the prior round — tried `playwright install chrome`/`chromium`, confirmed Chrome only exists on the Windows host side of this WSL setup, unreachable from here): real `204 No Content` deleting a fresh throwaway provider (traced with `-v`), the actual `groq-test` debris row genuinely deleted and confirmed gone via direct gateway GET, a real 409 on the active provider with the exact coded message, a real 404 for an unknown slug, and a free-text pipeline-override round-trip through a real PATCH. Correction: `ollama-local`'s default model (`qwen3.5:9b`) turned out to be a real installed model (live `GET .../models` proved it) — the proposal's "stale default model" assumption was wrong, so nothing needed fixing there beyond the `groq-test` cleanup. The actual click/browse UI fix itself remains unverified interactively (no browser available) — updated `pages/current-state.md` and `PROGRESS.md` with this caveat explicitly so a future session doesn't assume it's been seen working. Not committed.

## [2026-07-19] checkpoint | All 2026-07-18 work committed; llm-provider-delete-and-model-picker archived (commit 4803f26)

Session restored from wiki, then reconciled against git: the two rounds the
last checkpoint called "not committed" had already landed as `85e9365`
(same-origin /api proxy + raw_html + TagsInput fixes) and `c7dcd28`
(provider delete + model combobox rebuild). This session committed the
remaining dirty state — the archive move to
`openspec/changes/archive/2026-07-18-llm-provider-delete-and-model-picker/`
plus the delta-spec sync into `openspec/specs/llm-admin-ui/spec.md`
(browsable-combobox behavior, provider-deletion requirement) — as `4803f26`
after `openspec validate --all` passed 17/17. Working tree clean. Drift
noted while reconciling: commit `cd622a2` "feat(web): design-mode toggle +
jobs dashboard redesign" (2026-07-17) was never wiki-logged; recorded here
for the trail. Next up: interactive browser pass when Chrome becomes
reachable (combobox click behavior still never seen working live), then
Phase 7 hardening remainder.

## [2026-07-19] checkpoint | jobhunter DB lost + rebuilt; browser pass done — combobox verified interactively (12/12)

Real incident: `pg-learn` came back from the 2026-07-18 ~21:02 Docker
Desktop restart with a freshly `initdb`-ed empty cluster — its bind-mount
source `/home/mcgun/pgdata` no longer exists in the Ubuntu distro, so the
`jobhunter` DB (scraped jobs, reactions, runs) is orphaned/gone. Symptoms:
gateway 500s ("database \"jobhunter\" does not exist"), scraper
crash-looping. User chose rebuild over forensics: `dbmate up` (7
migrations) + `npm run db:seed` + re-applied `host.docker.internal:11434`
base-url fix by SQL. Stack healthy again. Then the standing
browser-verification gap was closed for real: Chrome now exists in WSL
(`/usr/bin/google-chrome` 150.0), a Playwright pass against the live stack
ran 12/12 meaningful checks green with zero console/CORS errors — including
every interactive ModelCombobox behavior (full list on open with a saved
value absent from it, search-only filtering, first-click select + close +
no reopen, checkmark on reopen, free-text "Use …", override "Inherit
default") plus the Profile skills-label focus fix and the same-origin
`/api` proxy observed from a real browser. PROGRESS.md 2026-07-19 entry has
full detail. Prevention item added to next-ups: move pg-learn onto a named
volume.

## [2026-07-19] checkpoint | Default model fixed + pg-learn on a named volume (with a caught mid-task mistake)

Closed both post-incident next-ups from the earlier 2026-07-19 checkpoint.
`ollama-local`'s default model is now `qwen3.5:9b` (real/installed; the
live model list also had an embedding model, two `:cloud` models, and two
abliterated variants — all deliberately excluded), set via a real `PATCH`
through the running gateway rather than raw SQL. `pg-learn` moved off its
bind mount onto a named volume (`pg-learn-data`) with
`--restart unless-stopped`, matching docs/DEPLOYMENT.md §3.1's own
pre-existing (previously unapplied) guidance.

Worth recording plainly: the first migration attempt destroyed the DB a
second time in one day. Copying from the old bind mount via a throwaway
`alpine` container silently produced zero bytes — Docker Desktop's WSL2
bind-mount path resolution isn't consistent across containers for the same
host path string — and the old container was removed before verifying the
copy. Caught immediately (next command failed with "database does not
exist"), DB rebuilt again (trivial cost — seed-only, no real data existed
to lose), and this time verified with a full `docker rm` + recreate from
only the named volume, which is the actual failure mode that caused the
original incident and now demonstrably survives it. Lesson written into
current-state.md: verify a copy succeeded before the destructive step that
depends on it. All four app containers reconfirmed healthy after. No code
changed — infra/data + one docs/DEPLOYMENT.md note. PROGRESS.md has full
detail. Also corrected stale wiki drift noticed in passing: current-state
still said "run /opsx:archive llm-settings-config when ready" — it was
already archived (2026-07-18-llm-settings-config exists in the archive
dir) — fixed.

## [2026-07-19] checkpoint | Phase 7 hardening fully implemented (51 tasks, 9 groups) — all gates green, live-verified

Closed the last open Phase 7 checklist items in one coordinated OpenSpec
change (`phase-7-hardening`): structured JSON logging + end-to-end
`X-Correlation-Id` propagation (web proxy → gateway via `nestjs-cls` →
scraper/LLM via a new ASGI middleware), coverage gates for all four
services (measured-then-ratcheted, never a guessed blanket percentage —
`@vitest/coverage-v8` scoped to service/guard/interceptor files in
`apps/api` and `src/lib/**` in `apps/web`; `pytest-cov` scoped to
domain/application in both Python services), gateway rate limiting
(`@nestjs/throttler`, internal automation exempt), per-source politeness
overrides (new `SourceBoundFetcher` wrapper, zero adapter changes), retry
with backoff on safe/idempotent calls (`fetchWithRetry` on the gateway,
`tenacity` in the LLM service's shared provider-adapter helper), a
dead-letter inspection endpoint, and a new e2e CI job.

Two real, honestly-documented findings along the way: (1) a `pytest-cov`
subtlety where `fail_under` values within rounding distance of the actual
coverage print "FAIL" without failing the exit code — caught by
deliberately testing an unambiguous gap before trusting any threshold; (2)
`infra/docker-compose.yml` assumes a pre-existing host Postgres and doesn't
fit CI, so the new e2e job uses `docs/DEPLOYMENT.md`'s documented
native-process approach with a GitHub Actions Postgres service container
instead — this specific job could not be verified against a real runner
from this environment and ships with `continue-on-error: true` plus an
explicit TODO, not silently green.

All gates green (scraper 89/89, llm 70/70, api 117/117, web 56/56,
shared-ts build). Docker stack rebuilt and redeployed; correlation-id chain
proven live end to end including through the web proxy and in a real
application-level log line (triggering an actual scrape run). Not
committed yet. Full detail in PROGRESS.md's 2026-07-19 entry and
`openspec/changes/phase-7-hardening/tasks.md`.

## [2026-07-19] checkpoint | Phase 7 committed + security-hardened + archived + real CI green — two genuine infra bugs found and fixed live

Committed Phase 7 hardening (`119a185`), archived the OpenSpec change
(`8939d02`), and pushed to `origin/master` for the first time. A
background security review on the commit found three real, confirmed
vulnerabilities, all fixed (`5bf3704`) with new tests: an XFF-based
rate-limit bypass (now gated behind `TRUST_PROXY_HEADERS`, default
`false`), an unbounded `Retry-After`/backoff delay in `fetchWithRetry`
(now capped), and an unvalidated client-supplied `X-Correlation-Id`
flowing verbatim into logs/headers everywhere it's read (now
format/length-validated with a minted-id fallback).

Watching the first real CI runs immediately paid for itself. The new `e2e`
job failed identically twice — not flaky. Root-caused via an independent
local reproduction: `apps/api`'s `npm run dev` (`tsx watch`, esbuild)
silently breaks NestJS's constructor-based dependency injection —
everything boots and every route maps cleanly, but every controller's
injected service reads as `undefined` at request time, so every real
endpoint past `/health` 500s. Invisible until now because local dev always
went through Docker (which builds via `tsc`), and native gateway boot had
never been exercised against real traffic before this CI job existed.
Fixed (`5d428d0`) by having CI build+run the compiled gateway instead of
`tsx watch` — the same path the Docker image already uses. That fix
surfaced a second, separate, genuine e2e test bug (`0011174`): the jobs
page's open-page locator matched multiple `role="region"` landmarks once
real content started rendering, tripping Playwright's strict mode — fixed
by matching `main` alone. Three consecutive real CI runs then passed
clean, including one with `continue-on-error: true` fully removed
(`8915790`) — the e2e job now genuinely gates the pipeline instead of
silently absorbing failures. Documented the `tsx`/DI gap in
`docs/DEPLOYMENT.md` §8.2 and a new project memory note so it isn't
rediscovered painfully later. PROGRESS.md has full detail.

## [2026-07-19] checkpoint | X-Forwarded-For forwarding closes the last Phase 7 follow-up — no open items remain

Implemented the web `/api` proxy's `X-Forwarded-For` forwarding (`2fd01bf`),
the one item still open from Phase 7's rate-limiting work. Caught a
would-be regression before writing any code: naively relaying the incoming
header would have reopened the exact spoofing bypass just fixed
gateway-side, since `X-Forwarded-For` isn't a forbidden `fetch()` header —
a browser can set it directly on a request to this route. Added a
mirrored, separately-gated `TRUST_PROXY_HEADERS` flag on the web side
(`shouldTrustIncomingProxyHeaders()`, default `false`); only forwards the
incoming header when a trusted reverse proxy is confirmed to sit in front
of the web app itself. Wired `infra/docker-compose.yml`'s `web` service to
read the repo-root `.env` (it previously had none, unlike the other three
services) so one file is the source of truth for both this and the
gateway's own flag. New tests for the route (trusted/untrusted/absent
cases) and the env helper; `api-rate-limiting` spec updated to describe
the resolved, opt-in behavior instead of the prior known limitation. Gates
green (web 65/65 vitest, tsc, eslint, full `npm run build`) and verified
live in real CI — all four jobs, including the now-mandatory `e2e`, passed
clean on the first push. This closes every open Phase 7 item; PROGRESS.md
has full detail.

## [2026-07-20] checkpoint | Jobs UI restored; Docker database route made reliable; mobile clipping covered

Reproduced the jobs screen failure in the live production stack and traced it
through the Next.js Server Component boundary to the gateway's `/v1/jobs` 500:
application containers could no longer reach the existing `pg-learn` container
through Docker Desktop's `host.docker.internal` route. Added the external
`job-hunter-database` network, connected `pg-learn` and all database consumers,
and switched Compose to Docker DNS (`pg-learn:5432`). Added a localized jobs
data-load fallback with retry/source actions so a future backend outage does not
collapse the whole workspace. Live mobile inspection then caught a separate
fixed-height flex bug clipping the opportunity summary; changed the jobs root to
grow and scroll naturally. Verified HTTP 200s across the live stack, 69/69 web
unit tests, strict TypeScript, lint with zero errors, production build, and three
non-skipped Playwright regressions covering EN, UA, and 390×844 mobile geometry.
Changes remain uncommitted; `.agents/` and `.playwright-mcp/` are user-owned and
must not be staged.
