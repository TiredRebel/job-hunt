## Context

Two independent counters live on two different tables and are surfaced on two different admin pages with no reconciliation:

- `scraper.scrape_runs.stats` (JSONB) — per-run counters (`discovered`, `fetched`, `inserted`, `duplicates`, `skipped`, `errors`) accumulated by `services/scraper/src/scraper/runner.py` and serialized via `RunStats.as_dict()` in `services/scraper/src/scraper/models.py`. The Sources page (`apps/web/src/components/sources/sources-page.tsx`) renders these per-run via `sourceRunCounts()`, mapping `discovered`→`found` and `inserted`→`new`.
- `core.jobs` — the post-LLM-processed jobs table. The Jobs dashboard `total` is `COUNT(*)` from `core.jobs j` with `j.status <> 'hidden'` (see `apps/api/src/infrastructure/repositories/postgres-job.repository.ts:122`).

Between them sits `scraper.jobs_raw` (created in `infra/db/migrations/0001_sources_and_jobs.sql:45`, extended with `processing_status` in `0006_processing_and_digest.sql` and `title`/`posted_at` in `0007`/`0011`). A `jobs_raw` row transitions `pending → queued → done | failed`. Only `done` rows have a matching `core.jobs` row (via `core.jobs.raw_id`); `pending`/`queued` rows are awaiting the n8n processing chain; `failed` rows are surfaced only via `GET /v1/automation/jobs/dead-letter` (`apps/api/src/automation/automation.controller.ts:74`) and not on either admin page today.

The user-visible effect: a source can show "Run: found=42, new=10" while the Jobs page shows `total=8`, and nothing explains the gap. The actual breakdown is `duplicates (32) + pending/queued (0–2) + failed LLM (0–2) + hidden/deleted core.jobs (0–2)`, but the UI has no way to express it.

Constraints:

- The scraper service owns `jobs_raw` writes and the `scrape_runs.stats` shape. This change must not push read-aggregation logic into the scraper (see ADR-002 in `docs/DECISIONS.md` — service-owned schemas).
- The gateway already reads `core.jobs` and `scraper.jobs_raw` (the automation module joins both — see `postgres-automation.repository.ts:83,214`). Adding a read-only join there is consistent.
- No new migrations: `processing_status`, `status`, `source_id`, `raw_id` all already exist.
- No new external dependencies; all stack choices are established (NestJS + pg, TanStack Query, shadcn/ui, next-intl).

## Goals / Non-Goals

**Goals:**

- Make the relationship between "scraper-discovered" and "jobs-table-visible" explicit and auditable from both the Sources page and the Jobs page, with no new infrastructure.
- One SQL query per page load for the reconciliation data; no N+1 per source.
- Reuse the existing dead-letter endpoint rather than re-implementing its semantics.
- Zero breaking API changes; all new endpoints are additive GETs.
- All four services' existing gates stay green (scraper/llm pytest + ruff + mypy; api/web vitest + tsc + eslint + build).

**Non-Goals:**

- Repairing the underlying processing chain (if `pending` is high, that's a separate ops issue — this change only surfaces it).
- Historical time-series of the reconciliation (e.g., "pending count over the last 7 days"). Point-in-time only.
- Surfacing per-run `discovered`/`duplicates`/`skipped` on the Jobs page. Those are run-scoped; the Jobs page is source-agnostic.
- Surfacing the dead-letter listing inline on the Jobs page. A deep link is enough; the dedicated listing stays where it is.
- Migrating `scrape_runs.stats` to a normalized table. The JSONB counters are fine for what they do.
- Any change to the scraper or LLM service code.
- Any change to the n8n workflows.

## Decisions

### D1 — Read reconciliation from the gateway, not the scraper

**Decision:** The new endpoints live on the gateway (`apps/api`), executing a single SQL query that joins `scraper.jobs_raw` to `core.jobs` grouped by `source_id`.

**Alternatives considered:**

- _Add a scraper endpoint_ `GET /sources/{slug}/jobs-summary` that returns the same join. Rejected: the scraper's bounded context is "fetch and persist raw postings," not "report on the post-processing state of `core.jobs`." Putting the join there violates ADR-002 (service-owned schemas) in reverse — the scraper would have to read `core.jobs`, which it never does today.
- _Pre-aggregate in a materialized view refreshed by a cron job._ Rejected for this scope: the table sizes here are seed-scale (hundreds of rows), a single indexed query is sub-10ms, and a MV introduces refresh-lag that would itself become a "why doesn't this match?" source.

**Rationale:** The gateway already owns cross-service reads for the automation module (`postgres-automation.repository.ts` joins `core.jobs` and `scraper.jobs_raw`). This is the same pattern, read-only.

### D2 — One new `reconciliation` module, not extensions on `sources` and `jobs`

**Decision:** Create a new NestJS module `apps/api/src/reconciliation/` with its own controller, service, repository, DTOs, and OpenAPI schemas. Endpoints: `GET /v1/reconciliation/sources` (per-source) and `GET /v1/reconciliation/jobs` (cross-source aggregate).

**Alternatives considered:**

- _Add the endpoints to the existing `sources` and `jobs` controllers._ Rejected: both controllers are already focused on their bounded contexts; bolting reconciliation onto them muddies the OpenAPI grouping (`@ApiTags`) and forces two repository ports to share one query. A single module keeps the cross-cutting concern in one place and makes it greppable.
- _Two separate modules_ (`sources-reconciliation`, `jobs-reconciliation`). Rejected: they share one SQL query and one repository; splitting would duplicate the port.

**Rationale:** Reconciliation is its own concern. One module = one port = one query = one set of OpenAPI schemas. The endpoints are mounted under `/v1/reconciliation/*` so they don't collide with existing routes.

### D3 — One SQL query, two bucket definitions

**Decision:** A single repository method `getReconciliation(): Promise<ReconciliationRow[]>` returns one row per `source_id` with these buckets:

```
raw_total        = COUNT(jobs_raw.id)
processed        = COUNT(jobs_raw.id) WHERE jobs_raw.processing_status = 'done'
pending          = COUNT(jobs_raw.id) WHERE processing_status IN ('pending','queued')
failed           = COUNT(jobs_raw.id) WHERE processing_status = 'failed'
visible_jobs     = COUNT(core.jobs.id) WHERE core.jobs.status <> 'hidden'
hidden_jobs      = COUNT(core.jobs.id) WHERE core.jobs.status = 'hidden'
```

The controller aggregates per-source rows into the cross-source total for `GET /v1/reconciliation/jobs`.

**Rationale:** `raw_total = processed + pending + failed` is an invariant the UI can display directly. `visible_jobs + hidden_jobs = total core.jobs for this source`. The gap between `processed` and `visible_jobs + hidden_jobs` is always explainable by `core.jobs` rows whose `raw_id` is null (legacy/manual) or whose `raw_id` points to a `jobs_raw` row that has since been deleted — expected to be zero on a clean seed but surfaced as a `legacy` delta if it appears.

**Alternatives considered:**

- _Separate queries per bucket._ Rejected: 6 queries per page load, and the counts could be inconsistent with each other if a write landed between them.
- _A single `CASE WHEN` aggregation._ Chosen — one pass, one set of bound values, one row per source.

### D4 — Web client: one query per page, keyed independently

**Decision:**

- `apps/web/src/lib/api/reconciliation.ts` exposes `getSourceReconciliation(signal?)` and `getJobsReconciliation(signal?)`, each returning the typed response from the corresponding gateway endpoint.
- `SourcesPageClient` issues one `useQuery` for `getSourceReconciliation` alongside the existing `listSources` and `listAdapters` queries. Each `SourceRow` looks up its bucket by `sourceId`.
- `JobsDashboardSummary` issues one `useQuery` for `getJobsReconciliation` alongside the existing `useJobsQuery`. The strip renders under the existing metrics row.

**Rationale:** Two pages, two queries — not one shared query. The pages have different refetch cadences (Sources doesn't refetch on jobs filter changes; Jobs doesn't refetch when a source toggle flips). Sharing would force unnecessary invalidations.

**Alternatives considered:**

- _One shared query with a query-key invalidation in both pages._ Rejected: cross-page coupling for no gain; the data is small and the endpoints are cheap.
- _Embedding the reconciliation into the existing `listSources` and `listJobs` responses._ Rejected: changes the shape of two established endpoints and forces every caller to fetch data they may not want.

### D5 — "Failed" bucket links to the existing dead-letter listing

**Decision:** The Jobs dashboard strip's `failed` value is a hyperlink (or a chip with an onClick) that navigates to a new read-only route `/en/jobs/dead-letter` (and `/ua/jobs/dead-letter`) rendering the existing `GET /v1/automation/jobs/dead-letter` response as a simple table. This is a small new web route, not a new API.

**Rationale:** The dead-letter endpoint already exists and is tested. The only gap is that no UI surfaces it. A dedicated route keeps the listing browsable and shareable.

**Alternatives considered:**

- _Open the dead-letter data in a dialog on the Jobs page._ Rejected: a dialog implies a transient view; the dead-letter listing is a real browsing surface that warrants its own URL.
- _Just show the count, no link._ Rejected: leaves the user stranded at "failed=3" with no way to see which three.

### D6 — No new tests for the SQL query itself beyond the repository unit test

**Decision:** The Postgres reconciliation repository gets a unit test using the same in-memory/database-seeded pattern as `postgres-automation.repository.spec.ts` (if one exists) or a typed fake at the port level for the service test. No new e2e harness is introduced.

**Rationale:** The current-state open threads note this repo has no supertest/e2e-controller harness. Introducing one is out of scope for this change. The SQL is simple enough to verify by a repository unit test that seeds known rows and asserts the bucket counts.

### D7 — Translations follow the existing namespace structure

**Decision:** New keys go under `sources.jobsSummary.*` (e.g., `raw`, `processed`, `pending`, `failed`, `hidden`) and `jobs.dashboard.reconciliation.*` (e.g., `discovered`, `processing`, `failed`, `hidden`, `viewDeadLetter`). Both `en.json` and `ua.json` get full sets.

**Rationale:** Matches the existing pattern (`sources.*`, `jobs.dashboard.*`). Avoids a top-level `reconciliation.*` namespace that would be orphaned from the pages it serves.

## Risks / Trade-offs

- **[Risk] Count drift between `processed` and `visible_jobs + hidden_jobs`** → Mitigation: the repository query returns both counts; the UI surfaces the delta as a tooltip (`"N legacy jobs have no raw parent"`) rather than hiding it. The invariant `raw_total = processed + pending + failed` is the user-facing integrity check, not the looser `processed ≈ visible + hidden`.
- **[Risk] Reconciliation query slow on a large `jobs_raw` table** → Mitigation: the query is one indexed `GROUP BY source_id` over `jobs_raw` with a LEFT JOIN to `core.jobs`. `jobs_raw.source_id` is already indexed via the FK. If the table ever grows past ~100k rows, a materialized view (rejected in D1 for now) becomes worthwhile — explicitly noted as a future option in the spec, not a blocker here.
- **[Risk] New endpoints enlarge the OpenAPI spec and shift the `shared-ts` client** → Mitigation: 2 new operations, 2 new schemas. Regeneration is mechanical (`apps/api/scripts/emit-openapi.ts` → `openapi-typescript`). Existing callers are unaffected; this is purely additive.
- **[Risk] Users expect the Sources `found`/`new` counters to exactly equal the new summary's `raw`/`processed`** → Mitigation: they don't — `found` is per-run, `raw` is cumulative across all runs for the source. The UI copy distinguishes "this run" vs "all runs" explicitly (`sources.jobsSummary.allRuns` label). This is the whole point of the change.
- **[Risk] The dead-letter route becomes a maintenance surface** → Mitigation: it's a read-only table with no mutations; reuses the existing endpoint; small unit + Playwright test. Low surface area.
- **[Trade-off] Two queries on the Jobs page** (jobs list + reconciliation) → Accepted: the reconciliation query is cheap and independent; TanStack Query already handles parallel fetching. Caching keeps it free on filter-only refetches.
- **[Trade-off] A new `/v1/reconciliation/*` URL namespace** → Accepted: cleaner than overloading `/v1/sources` and `/v1/jobs`, and easy to grep for.

## Migration Plan

1. **Backend first**, behind no flag (additive endpoints):
   - Add `apps/api/src/reconciliation/` module; register in `AppModule`.
   - Add repository + service + controller + DTOs.
   - Regenerate OpenAPI + `shared-ts` client.
   - Unit tests; gates green.
2. **Web second**:
   - Add `lib/api/reconciliation.ts` + tests.
   - Extend `SourcesPageClient`/`SourceRow` with the new summary line; extend `JobsDashboardSummary` with the strip.
   - Add `/[locale]/jobs/dead-letter` route + simple table component.
   - Translations; component tests; Playwright regressions.
3. **No database migration step.** No env vars. No Docker compose changes.
4. **Rollback:** revert the commit; the new endpoints are unused by any other system and carry no data dependencies. No data to back out.

## Open Questions

- Should the dead-letter listing eventually grow filters/search? Out of scope here; the spec only requires a browsable table. Punted to a future change if a real need surfaces.
- Should the reconciliation endpoint expose a `last_run_id` per source so the UI can deep-link "show me what the last run contributed"? Not required for the discrepancy explanation. Can be added later without breaking the current shape.
