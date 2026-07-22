# jobs-reconciliation

## Purpose

Reconciliation endpoints that compare scraped raw jobs against processed/visible jobs, per source and in aggregate, plus the public dead-letter listing used to surface failed jobs — feeding the jobs-health summaries on the Jobs and Sources dashboards.

## Requirements

### Requirement: Per-source jobs-health summary

The gateway SHALL expose `GET /v1/reconciliation/sources` returning one row per `core.sources` row with the following buckets computed from a single query that joins `scraper.jobs_raw` (LEFT) to `core.jobs` (LEFT) grouped by `source_id`: `sourceId`, `sourceSlug`, `rawTotal` (all `jobs_raw` rows for the source), `processed` (`processing_status = 'done'`), `pending` (`processing_status IN ('pending','queued')`), `failed` (`processing_status = 'failed'`), `visibleJobs` (`core.jobs.status <> 'hidden'`), `hiddenJobs` (`core.jobs.status = 'hidden'`). The response SHALL be an array of objects with exactly these fields, ordered by `sourceSlug` ascending. The endpoint SHALL be tagged `Reconciliation` in the OpenAPI spec and SHALL require no authentication beyond what the rest of the gateway requires.

#### Scenario: Empty database

- **WHEN** the gateway has zero sources
- **THEN** `GET /v1/reconciliation/sources` returns HTTP 200 with an empty array

#### Scenario: Source with mixed processing states

- **WHEN** source `dou` has 10 `jobs_raw` rows (7 `done`, 2 `pending`, 1 `failed`) and 6 of the `done` rows map to `core.jobs` rows with `status <> 'hidden'` and 1 maps to a `core.jobs` row with `status = 'hidden'`
- **THEN** the response row for `dou` has `rawTotal=10`, `processed=7`, `pending=2`, `failed=1`, `visibleJobs=6`, `hiddenJobs=1`

#### Scenario: Source with no scrape runs yet

- **WHEN** source `djinni` exists in `core.sources` but has no `scraper.jobs_raw` rows
- **THEN** the response row for `djinni` has every bucket set to 0 (`rawTotal=0`, `processed=0`, `pending=0`, `failed=0`, `visibleJobs=0`, `hiddenJobs=0`)

### Requirement: Cross-source jobs reconciliation aggregate

The gateway SHALL expose `GET /v1/reconciliation/jobs` returning the same buckets summed across all sources, plus a `legacyDelta` integer equal to `processed - (visibleJobs + hiddenJobs)`. The response SHALL be a single object with `rawTotal`, `processed`, `pending`, `failed`, `visibleJobs`, `hiddenJobs`, and `legacyDelta` fields. This endpoint SHALL be the data source for the Jobs dashboard reconciliation strip.

#### Scenario: Aggregate across three sources

- **WHEN** three sources have `rawTotal` of 10, 5, and 0; `visibleJobs` of 6, 4, and 0; `hiddenJobs` of 1, 0, and 0; `processed` of 7, 4, and 0
- **THEN** `GET /v1/reconciliation/jobs` returns `rawTotal=15`, `processed=11`, `visibleJobs=10`, `hiddenJobs=1`, `legacyDelta=0`

#### Scenario: Legacy delta is surfaced when core.jobs has rows without a raw parent

- **WHEN** the summed `processed` is 11 but `visibleJobs + hiddenJobs` is 12 (one `core.jobs` row has `raw_id IS NULL`)
- **THEN** `legacyDelta` is `-1` and the response is HTTP 200 (the endpoint does not fail on a non-zero delta)

### Requirement: Reconciliation endpoint error handling

When the underlying database query fails, both reconciliation endpoints SHALL return HTTP 502 with a correlation-id-aligned error body matching the gateway's existing error shape. The endpoints SHALL never return a partial or empty result on a query failure — a failure is an error, not an empty array.

#### Scenario: Database unreachable

- **WHEN** the Postgres database is unreachable and `GET /v1/reconciliation/sources` is called
- **THEN** the response is HTTP 502 with the gateway's standard error body and a non-empty `correlationId`

### Requirement: Public dead-letter listing

The gateway SHALL expose `GET /v1/reconciliation/dead-letter?limit=N` as a public, dashboard-facing mirror of the internal-token-guarded `GET /v1/automation/jobs/dead-letter`. The endpoint SHALL return the same `DeadLetterJobResponse` shape (id, sourceId, sourceSlug, externalId, url, title, processAttempts, processedAt) and SHALL NOT require `X-Internal-Token` authentication. The default `limit` SHALL be 50 when omitted. This endpoint is the data source for the `/[locale]/jobs/dead-letter` web route.

#### Scenario: Browser fetches the dead-letter listing

- **WHEN** the web app calls `GET /v1/reconciliation/dead-letter` with no `X-Internal-Token` header
- **THEN** the response is HTTP 200 with an array of dead-lettered raw jobs (possibly empty)

#### Scenario: Scraper service unreachable

- **WHEN** the scraper service is unreachable and `GET /v1/reconciliation/dead-letter` is called
- **THEN** the response is HTTP 502 with the gateway's standard error body

### Requirement: Reconciliation data freshness

The reconciliation endpoints SHALL execute a live SQL query on every request and SHALL NOT cache results server-side. The web client MAY cache responses via TanStack Query with a `staleTime` of at most 60 seconds.

#### Scenario: A new scrape run lands between two calls

- **WHEN** `GET /v1/reconciliation/sources` is called, then a scrape run inserts 5 new `jobs_raw` rows for source `dou`, then the endpoint is called again 10 seconds later
- **THEN** the second response reflects the 5 new rows in `rawTotal` and `pending` for `dou`

### Requirement: Dead-letter listing route

The web app SHALL expose a browsable dead-letter listing at `/[locale]/jobs/dead-letter` rendering the response of `GET /v1/reconciliation/dead-letter` as a table with columns: external id, source slug, title, last processing attempt time (`processedAt`), and failed-attempt count (`processAttempts`). The route SHALL be linked from the Jobs dashboard reconciliation strip's `failed` bucket and SHALL be locale-aware (`/en/jobs/dead-letter`, `/ua/jobs/dead-letter`). The page SHALL render a localized empty state when the dead-letter list is empty, and SHALL degrade gracefully (rendering the empty state rather than an error page) when the endpoint itself is unreachable.

#### Scenario: User follows the failed-bucket link

- **WHEN** the Jobs dashboard strip shows `failed=3` and the user clicks it
- **THEN** the browser navigates to `/en/jobs/dead-letter` (or the UA equivalent) and the table renders 3 rows

#### Scenario: No dead-lettered jobs

- **WHEN** the user opens `/en/jobs/dead-letter` and the endpoint returns an empty array
- **THEN** the page renders a localized empty state explaining no jobs are in the dead letter

#### Scenario: Dead-letter endpoint unreachable

- **WHEN** the user opens `/en/jobs/dead-letter` and `GET /v1/reconciliation/dead-letter` returns 502
- **THEN** the page renders the localized empty state rather than a framework error page, so the rest of the workspace remains usable
