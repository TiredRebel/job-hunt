## Why

The Sources admin page surfaces per-run scrape counters (`discovered`, `inserted`, `duplicates`, `skipped`, `errors`) and the Jobs dashboard surfaces `total` from `core.jobs`. Users reasonably expect "what the scraper found" to line up with "what the jobs table shows," but the two numbers measure different things on different tables, never reconciled in the UI:

- **Sources page counts feed `scraper.scrape_runs.stats`** — per-run counters written by `runner.py` (`RunStats.as_dict()`), accumulated across all search queries of a single run, with no cross-run or per-source aggregation.
- **Jobs page `total` counts `core.jobs`** rows surviving `j.status <> 'hidden'` (see `postgres-job.repository.ts:122`) — i.e. raw postings that were _also_ successfully processed by the LLM normalize/match pipeline and upserted via `PostgresAutomationRepository.persistJobResult`.
- **The gap between them is silent and unexplained**: a posting can be `discovered` and `inserted` into `scraper.jobs_raw` but never become a `core.jobs` row because (a) `processing_status` is still `pending`/`queued` (no n8n/processing-chain run picked it up yet), (b) the LLM pipeline marked it `failed` (now visible only on the dead-letter endpoint, not in either page), or (c) it was later `hidden` or `deleted` from `core.jobs`. None of these states is surfaced where the user is comparing the numbers.

Without a reconciliation view, a user seeing "Run: found=42, new=10" on Sources and `total=8` on Jobs has no way to tell whether 32 leads were duplicates, 2 are mid-processing, 3 failed LLM normalization, or the scrape run is still in flight. This proposal makes the relationship explicit and auditable from both pages.

## What Changes

- **Per-source job-health summary on the Sources page**: each source row gains a compact "jobs" stat line — `raw / processed / failed / hidden` — derived from `scraper.jobs_raw` joined to `core.jobs` for that source, replacing the implicit "new count = visible jobs" mental model. The run-history table keeps its current per-run counters; the new summary is the cross-run aggregate.
- **Jobs dashboard header gains a "discovered vs. visible" reconciliation strip**: under the existing `total` metric, a secondary line shows `discovered (all sources) · processing · failed · hidden`, so a falling `total` is explainable at a glance without leaving `/jobs`.
- **New gateway endpoint `GET /v1/sources/{slug}/jobs-summary`** (and `GET /v1/sources/jobs-summary` for all sources at once) returning `{ raw, processed, failed, hidden, pending, queued, deleted }` counts grouped by source, with a single SQL query against `scraper.jobs_raw` LEFT JOINed to `core.jobs`. The scraper service is not involved — the gateway already owns the `core.jobs` and `scraper.jobs_raw` schemas for the automation module.
- **New gateway endpoint `GET /v1/jobs/reconciliation`** returning the same buckets aggregated across all sources, for the Jobs dashboard header strip. Reuses the same repository method.
- **Surfacing of the existing dead-letter endpoint on the Jobs page**: a "Failed processing" chip links to the dead-letter listing (already exposed via `GET /v1/automation/jobs/dead-letter`), so the `failed` bucket is one click away, not a hidden API.
- **Localized copy** for the new summary labels in `en`/`ua`, following the existing `sources.*` and `jobs.dashboard.*` translation namespaces.
- **No schema migration**: all required columns (`processing_status`, `status`, `source_id`) already exist. No new tables.

## Capabilities

### New Capabilities

- `jobs-reconciliation`: a read-only reconciliation layer that explains the numerical gap between scraper-discovered postings (`scraper.jobs_raw`) and visible processed jobs (`core.jobs`), surfaced on both the Sources and Jobs pages via new gateway endpoints.

### Modified Capabilities

- `sources-admin`: each source row SHALL additionally render an aggregate jobs-health summary (`raw / processed / failed / hidden`), not only per-run counters.
- `jobs-dashboard`: the dashboard header SHALL additionally render a reconciliation strip explaining how `total` relates to the broader discovered count, with deep links to the dead-letter listing for the `failed` bucket.

## Impact

- **Backend (apps/api)**:
  - New application service `JobsReconciliationService` + port `JobsReconciliationRepository` + Postgres implementation in `infrastructure/repositories/`.
  - New controller endpoints on the `sources` and `jobs` modules (or a new `reconciliation` module — see design.md D2).
  - OpenAPI schema regenerated; `packages/shared-ts` client regenerated.
- **Frontend (apps/web)**:
  - `SourcesPageClient` and `SourceRow` consume the new summary endpoint via TanStack Query; new compact stat rendering.
  - `JobsDashboardSummary` consumes the reconciliation endpoint; new secondary strip below the existing metrics.
  - New `lib/api/reconciliation.ts` typed client.
- **Tests**:
  - Gateway: unit tests for the new service + repository (in-memory fake following the existing pattern); e2e controller test not in scope (no supertest harness — see current-state.md open threads).
  - Web: `lib/api/reconciliation.spec.ts` + component tests for the new strips; Playwright regression for the Sources row summary presence and Jobs header strip presence.
- **Translations**: new keys under `sources.jobsSummary.*` and `jobs.dashboard.reconciliation.*` in `messages/en.json` and `messages/ua.json`.
- **No migrations**, no scraper or LLM service changes, no n8n workflow changes.
- **No breaking API changes**: all new endpoints are additive GETs.
