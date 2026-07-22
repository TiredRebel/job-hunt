---
updated: 2026-07-21
sources:
  [
    ../../PROGRESS.md,
    ../../openspec/changes/sources-jobs-count-discrepancy/tasks.md,
    ../../openspec/changes/sources-jobs-count-discrepancy/design.md,
    ../../docs/ARCHITECTURE.md,
    ../../docs/DEPLOYMENT.md,
    ../../infra/docker-compose.yml,
    ../../apps/web/e2e/reconciliation.spec.ts,
    ../../.github/workflows/ci.yml,
  ]
---

<!-- checkpoint: Jobs-count reconciliation surfaced end-to-end and live-verified on 2026-07-21 (OpenSpec sources-jobs-count-discrepancy, not yet committed). The Sources-page per-run counters and the Jobs-dashboard total now share an explicit reconciliation view; the actual user-reported discrepancy (dou: 151 raw / 3 visible / 147 pending / 1 failed; workua: 64 raw / 0 visible / 64 pending) is visible at a glance. -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-21)

**Phases 0–7 are complete and committed.** Since the 2026-07-20 jobs UI
repair (`7029731`, on `origin/master`), one OpenSpec change shipped on a
fresh `fix-jobs_count` branch and is **fully implemented + live-verified
but not yet committed**: `sources-jobs-count-discrepancy` (44/44 tasks
done). It closes the silent numerical gap between the Sources page's
per-run scrape counters (`scraper.scrape_runs.stats`) and the Jobs
dashboard's `total` (`core.jobs` with `status <> 'hidden'`) — the
original user-reported confusion.

### ✅ sources-jobs-count-discrepancy — implemented + live-verified (2026-07-21)

OpenSpec change at
`openspec/changes/sources-jobs-count-discrepancy/` (proposal, design, 3
delta specs, 44-task tasks.md all complete and validated).

**Gateway** (`apps/api`):

- New `reconciliation` module: `reconciliation.controller.ts`,
  `reconciliation.service.ts`, `reconciliation.response.dto.ts`,
  `reconciliation.module.ts`. Domain value types in
  `domain/reconciliation.model.ts` (`ReconciliationRow`,
  `ReconciliationAggregate` with `legacyDelta`). Port in
  `application/ports/jobs-reconciliation.port.ts`. Postgres impl in
  `infrastructure/repositories/postgres-jobs-reconciliation.repository.ts`
  — a single `GROUP BY source_id` query with `COUNT(*) FILTER (WHERE …)`
  buckets joining `core.sources` LEFT JOIN `scraper.jobs_raw` LEFT JOIN
  `core.jobs`.
- Three new public endpoints mounted at `/v1/reconciliation/*`:
  - `GET /sources` — per-source buckets `raw / processed / pending /
failed / visible / hidden`, ordered by `sourceSlug` ascending.
  - `GET /jobs` — cross-source aggregate + `legacyDelta = processed -
(visibleJobs + hiddenJobs)`.
  - `GET /dead-letter?limit=N` — public, dashboard-facing mirror of the
    internal-token-guarded `GET /v1/automation/jobs/dead-letter`. Added
    during live verification after discovering the automation endpoint
    can't be called from a browser; reuses the existing `ScraperClient`
    injected into `ReconciliationService` (the automation module stays
    guarded — no security surface change).
- OpenAPI regenerated: 3 new operations, 3 new schemas
  (`SourceReconciliationResponseDto`,
  `JobsReconciliationAggregateResponseDto`, and the existing
  `DeadLetterJobResponse` now referenced by the public mirror). No
  unreferenced schemas. `packages/shared-ts` client regenerated.

**Web** (`apps/web`):

- `SourcesPageClient`/`SourceRow` render a per-source cumulative
  jobs-health summary line (`Discovered / Processed / Pending / Failed /
Hidden`) under the source name, labeled with a localized "Across all
  runs" tooltip to distinguish from the per-run counters in the run
  history. Degrades gracefully (no summary line) if the reconciliation
  endpoint fails.
- `JobsDashboardSummary` renders a secondary reconciliation strip below
  the existing four-metric row (`Discovered / Processing / Failed /
Hidden`). `Failed` deep-links to `/[locale]/jobs/dead-letter` only
  when non-zero. Strip hidden entirely on a fresh install
  (`discovered=0`). Degrades gracefully on endpoint failure.
- New `/[locale]/jobs/dead-letter` route (Server Component) renders the
  public dead-letter endpoint response as a table; localized empty
  state; degrades to empty state (not a framework error) on a 502.
- New `lib/api/reconciliation.ts` + `lib/api/automation.ts` typed
  clients. `query-keys.ts` extended with `reconciliation.sources` /
  `reconciliation.jobs`.
- Localized keys added to `en.json` + `uk.json` under
  `sources.jobsSummary.*`, `jobs.dashboard.reconciliation.*`, and
  `jobs.deadLetter.*`.

**Live verification** (2026-07-21):

- Docker stack rebuilt and redeployed; all four services healthy.
- `GET /v1/reconciliation/sources` returns the real current state: dou
  148/3/144/1/3/0, workua 64/0/64/0/0/0, others 0. `GET /v1/reconciliation/jobs`
  returns `rawTotal=212, processed=3, pending=208, failed=1,
visibleJobs=3, hiddenJobs=0, legacyDelta=0`.
- Triggered a fresh scrape on `dou` via `POST /v1/sources/dou/scrape`;
  reconciliation updated in real time (`rawTotal` 148 → 151, `pending`
  144 → 147) — the freshness requirement (D3) is met.
- `GET /v1/reconciliation/dead-letter` returns the actual dead-lettered
  job (id 1, `332591`, "Senior Software Engineer (Python)", 3 attempts).
- Dead-letter web route renders the real row in a browser.
- 3/3 new Playwright regressions pass (`e2e/reconciliation.spec.ts`):
  Sources summary line present on at least one row; Jobs dashboard
  reconciliation strip renders with all four buckets; dead-letter route
  renders a table or empty state.

**Gates green throughout**: api 147/147 vitest (+1 new reconciliation
test), tsc, eslint, build; web tsc, eslint (only the 2 pre-existing
TanStack React Compiler warnings), build, vitest tests pass — the
`src/lib/**` coverage-gate failure (function coverage 72.22% vs 80%
threshold) is **pre-existing on master**, not caused by this change
(verified by `git stash` + rerun on master: same failure, same numbers).
The 2 pre-existing `board-reorder.spec.ts` failures are data-state
issues (need 3 saved-stage seeded jobs the current DB doesn't have),
also confirmed present on master.

**Not committed** — working tree on `fix-jobs_count` branch has 9
modified + 9 new file groups, awaiting explicit user go-ahead per the
repo's git-workflow convention.

### ✅ Phase 7 — Hardening: fully implemented, committed, archived, and CI-verified (2026-07-19)

OpenSpec `phase-7-hardening` closed all four remaining Phase 7 checklist
items in one coordinated pass (51 tasks, 9 groups — see
`openspec/changes/phase-7-hardening/tasks.md` for the full per-group
detail, and `PROGRESS.md`'s 2026-07-19 log entry for the comprehensive
summary). Highlights:

- **Correlation ids end to end**: `X-Correlation-Id` propagates web `/api`
  proxy → gateway (adopted as pino's `req.id`, threaded via `nestjs-cls`
  to 3 HTTP clients) → scraper/LLM (new ASGI middleware + JSON logging).
  Verified live against the rebuilt Docker stack, including through the
  web proxy and in an actual application-level log line (not uvicorn's own
  access logger, which correctly shows `null` — it runs outside any
  application middleware).
- **Coverage gates**: `@vitest/coverage-v8` (api, web) + `pytest-cov`
  (scraper, llm), all scoped to domain/application (not thin
  controllers/DTOs/infra adapters) with thresholds set from measured
  coverage, never guessed. Verified each gate genuinely fails when unmet —
  caught a real `pytest-cov` subtlety where a `fail_under` within rounding
  distance of the actual value prints "FAIL" without failing the exit code.
- **Rate limiting**: `@nestjs/throttler` on the gateway, internal automation
  routes exempt. Originally keyed on `X-Forwarded-For` unconditionally when
  present — a same-day security review caught this as a rate-limit-bypass
  vector (any direct caller can spoof the header) and it's now gated
  behind `TRUST_PROXY_HEADERS` (default `false`, socket address otherwise).
  The web `/api` proxy now has its own, separately-gated
  `TRUST_PROXY_HEADERS` too (`2fd01bf`, same day) — forwards an incoming
  `X-Forwarded-For` only when explicitly trusted, since the header isn't a
  forbidden `fetch()` header and a browser could otherwise spoof it
  directly at that hop. Set both flags to get real per-browser-client
  buckets when a reverse proxy sits in front of the whole stack.
- **Per-source politeness**: `PolitenessGate` gained per-call overrides; a
  new `SourceBoundFetcher` wrapper applies a source's `core.sources.config`
  politeness keys transparently, with zero changes needed to any adapter.
- **Retries**: new `fetchWithRetry` (gateway) wired into safe/idempotent
  calls only, with explicit comments on every un-retried call explaining
  why (run-creation, attempt-counter increments, resource
  creation/deletion, cover-letter generation's cost + non-determinism).
  LLM provider calls wrapped in `tenacity` inside the shared `providers/base.py`.
- **Dead-letter**: `GET /jobs_raw/dead-letter` (scraper) → `GET
/v1/automation/jobs/dead-letter` (gateway), OpenAPI + shared-ts regenerated.
- **E2e CI job** — a real design pivot found during implementation:
  `infra/docker-compose.yml` assumes a pre-existing host Postgres (doesn't
  fit CI), and Playwright's own config already boots the web app natively —
  so the job uses `docs/DEPLOYMENT.md` §8.2's native-process approach with a
  GitHub Actions `postgres:17` service container instead, seeding one real
  `core.jobs` row so the happy path exercises the full flow.

**Gates green throughout**: scraper 89/89 pytest (+1 skipped, 93.78%
coverage), llm 70/70 pytest (98.76%), api 117/117 vitest, web 56/56 vitest,
shared-ts build — all typecheck/lint/format/mypy clean.

**Committed** (`119a185`) and **archived** (`8939d02`, delta specs synced
into `openspec/specs/`: new `observability`, `api-rate-limiting`,
`request-resilience`, `quality-gates` capabilities; modified
`fetch-strategy-ladder` and `processing-chain`).

### Post-commit hardening + real CI verification (same day)

A background security review on the Phase 7 commit found three real,
confirmed vulnerabilities — all fixed (`5bf3704`), all with new tests:
XFF-based rate-limit bypass (now gated behind `TRUST_PROXY_HEADERS`,
default `false`), an unbounded `Retry-After`/backoff delay in
`fetchWithRetry` (now capped at `MAX_DELAY_MS`), and an unvalidated
client-supplied `X-Correlation-Id` flowing into logs/headers everywhere it
was read (now format/length-validated, falling back to a minted id).

Pushed to `origin/master` and watched real CI for the first time — it
immediately paid off. **The `e2e` job failed identically on its first two
runs**: not flaky, not a data bug — `apps/api`'s `npm run dev` (`tsx
watch`, esbuild) silently breaks NestJS's constructor-based DI. The
gateway boots and maps every route with zero errors, but every
controller's injected service reads as `undefined` at request time, so
every real endpoint past `/health` 500s. Confirmed by an independent local
repro (identical failure under `tsx watch`, clean under the real `tsc`
build) — this was invisible until now because local dev always went
through Docker. Fixed (`5d428d0`) by having CI build+run the compiled
gateway instead of `tsx watch`, same path the Docker image already uses;
documented in `docs/DEPLOYMENT.md` §8.2 and in a project memory note. That
fix surfaced a second, separate e2e bug (`0011174`): the `openJobs()`
locator matched multiple `role="region"` landmarks on the real (now
correctly rendering) page, tripping Playwright's strict mode — fixed by
matching `main` alone. Three consecutive real CI runs then passed clean,
including one with `continue-on-error: true` fully removed (`8915790`) —
the e2e job now genuinely gates the pipeline.

### Jobs UI outage and mobile clipping fixed (2026-07-20)

The jobs page was reproducing the attached failure as a production Server
Component error boundary. The visible blank/error state was downstream of an
API 500: `jh-api` could not connect to PostgreSQL through
`host.docker.internal` even though `localhost:5432` remained reachable from
Windows. The long-lived `pg-learn` container and application services now
share the external `job-hunter-database` Docker network and use Docker DNS
(`pg-learn:5432`) directly. `docs/DEPLOYMENT.md` records the one-time network
setup and rationale.

The route is also resilient if the data plane fails again: expected API and
network failures render a localized, actionable `JobsLoadError` inside the
normal application shell, with retry and sources actions, while unexpected
programming errors still reach the framework error boundary. A route unit test
covers that distinction. A separate mobile layout defect was exposed during
visual verification: the jobs client used a fixed-height flex root that
compressed the opportunity summary from 337px of content into 87px. The root
now grows with its content and lets the dashboard scroll.

Verified against the rebuilt live stack: gateway health/jobs, scraper health,
LLM health, and `/en/jobs` all return HTTP 200; EN and UA desktop jobs pages
plus the 390×844 mobile geometry regression pass (3 Playwright tests); web
Vitest passes 69/69; strict TypeScript passes; ESLint has zero errors and only
the two pre-existing TanStack React Compiler compatibility warnings. Docker's
web production build and Compose config validation pass. The complete repair
was committed as `7029731` and pushed to `origin/master`.

## Next up

- Commit `sources-jobs-count-discrepancy` (currently on `fix-jobs_count`
  branch, 9 modified + 9 new file groups, all gates green and
  live-verified) once the user gives explicit go-ahead — then archive
  the OpenSpec change and sync the delta specs into
  `openspec/specs/jobs-reconciliation/`, `openspec/specs/sources-admin/`,
  and `openspec/specs/jobs-dashboard/`.
- After archiving: the `jobs-reconciliation` capability is new (3
  requirements + dead-letter route); `sources-admin` and `jobs-dashboard`
  gain modified requirements.
- The pre-existing `src/lib/**` web coverage-gate failure
  (functions 72.22% vs 80% threshold) and the 2 `board-reorder.spec.ts`
  data-state failures are tracked separately, not caused by this change.

## In-flight / open threads

- **agent-browser's CLI contract is unverified** — before relying on
  `agent-browser`-strategy scraping for real, install it locally
  (`npm i -g agent-browser && agent-browser install`), run `agent-browser
skills get core --full` to get the authoritative command reference, and
  adjust `SCRAPER_AGENT_BROWSER_CMD` / the output-parsing logic in
  `agent_browser.py` if the real contract differs from the `read [url]`
  guess.
- **Live end-to-end smoke of the n8n workflows is still an operator step**:
  no Telegram bot / SMTP credentials exist yet. See `n8n/README.md`
  "Verifying end to end".
- Redis/arq queue handoff between scraper and llm (ARCHITECTURE.md mentions
  it) was explicitly **not** built — the processing chain polls the
  gateway instead; revisit if scale demands it.
- Dictionary enable is **per-dictionary** (API has no per-item enabled flag).
- No HTTP-level route-order test exists for `GET /sources/adapters` vs
  `GET /sources/:slug` (verified by code reading instead) — this repo has
  no supertest/e2e-controller harness yet; introduce one if a second
  same-verb route-ordering case ever comes up.
- Component-rendering coverage remains sparse: the jobs initial-load failure
  now has one route regression, but Sources, Dictionaries, Profile, and LLM
  Settings still only have `lib/api/*` client-layer tests. This is why Phase
  7's web coverage gate remains scoped to `src/lib/**`.

## Resume commands

```powershell
cd E:\job-hunter
npm install
cd services\llm; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd services\scraper; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd apps\api; npm run typecheck; npm run lint; npm run test; npm run build; cd ..\..
cd packages\shared-ts; npm run typecheck; npm run lint; npm run build; cd ..\..
cd apps\web
npm run typecheck; npm run lint; npm run test; npm run build
# e2e (optional — needs API on :4000 + seed):
npm run test:e2e:install
npm run test:e2e
cd ..\..
cat PROGRESS.md

# Or bring up the full stack via Docker (see docs/DEPLOYMENT.md):
docker compose -f infra/docker-compose.yml --profile services up -d --build
```
