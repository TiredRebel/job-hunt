## 1. Gateway: reconciliation module scaffold

- [x] 1.1 Create `apps/api/src/reconciliation/` module directory with `reconciliation.module.ts`, `reconciliation.controller.ts`, `reconciliation.service.ts`, `reconciliation.response.dto.ts`
- [x] 1.2 Add `apps/api/src/application/ports/jobs-reconciliation.port.ts` defining the `JobsReconciliationRepository` port and the `ReconciliationRow` / `ReconciliationAggregate` value types
- [x] 1.3 Add `apps/api/src/domain/reconciliation.model.ts` with the framework-free value types (`ReconciliationRow`, `ReconciliationAggregate`)
- [x] 1.4 Register `ReconciliationModule` in `apps/api/src/app.module.ts` and confirm the service boots

## 2. Gateway: reconciliation repository

- [x] 2.1 Add `apps/api/src/infrastructure/repositories/postgres-jobs-reconciliation.repository.ts` implementing `JobsReconciliationRepository` with a single SQL query: `SELECT s.id, s.slug, COUNT(raw.id) AS raw_total, COUNT(raw.id) FILTER (WHERE raw.processing_status = 'done') AS processed, COUNT(raw.id) FILTER (WHERE raw.processing_status IN ('pending','queued')) AS pending, COUNT(raw.id) FILTER (WHERE raw.processing_status = 'failed') AS failed, COUNT(j.id) FILTER (WHERE j.status <> 'hidden') AS visible_jobs, COUNT(j.id) FILTER (WHERE j.status = 'hidden') AS hidden_jobs FROM core.sources s LEFT JOIN scraper.jobs_raw raw ON raw.source_id = s.id LEFT JOIN core.jobs j ON j.raw_id = raw.id GROUP BY s.id, s.slug ORDER BY s.slug ASC`
- [x] 2.2 Map the row shape to `ReconciliationRow`; the service aggregates rows into `ReconciliationAggregate` (sums + `legacyDelta = processed - (visibleJobs + hiddenJobs)`)
- [x] 2.3 Verify the query plan uses the existing FK indexes (`jobs_raw.source_id`, `core.jobs.raw_id`); no new indexes needed

## 3. Gateway: service + controller + DTOs

- [x] 3.1 Implement `ReconciliationService.listBySource()` returning `readonly ReconciliationRow[]` and `aggregate()` returning `ReconciliationAggregate`
- [x] 3.2 Implement `ReconciliationController` with `@Get('sources')` and `@Get('jobs')` mounted at `/v1/reconciliation` (controller `@Controller('v1/reconciliation')`, `@ApiTags('Reconciliation')`)
- [x] 3.3 Add response DTOs `SourceReconciliationResponseDto` and `JobsReconciliationAggregateResponseDto` with `@ApiProperty` on every field, matching the value types exactly (bigint `sourceId` as `number`)
- [x] 3.4 Confirm both endpoints return HTTP 200 on success and 502 on database failure (let the existing global exception filter translate the thrown error)

## 4. Gateway: OpenAPI + shared-ts regeneration

- [x] 4.1 Run `cd apps/api && npm run build` then `tsx scripts/emit-openapi.ts` to regenerate `openapi.json`; verify 2 new operations and 2 new schemas appear and there are 0 unreferenced schemas
- [x] 4.2 Run `cd packages/shared-ts && npm run build` to regenerate the typed client; verify `ApiPaths`/`ApiOperations` include the two new operations
- [x] 4.3 Re-export the new response types from `packages/shared-ts/src/index.ts` if not already auto-exported

## 5. Gateway: unit tests

- [x] 5.1 Add `apps/api/src/reconciliation/reconciliation.service.spec.ts` with an in-memory `JobsReconciliationRepository` fake (following the existing `*.service.spec.ts` pattern); cover: empty list, single source with mixed buckets, three-source aggregate, non-zero `legacyDelta`
- [x] 5.2 Add a repository test (or skip if no existing pg-repository test harness — confirm by checking `apps/api/src/infrastructure/repositories/*.spec.ts`); if none exists, document the gap in `current-state.md` open threads and rely on the service test + live verification
- [x] 5.3 Run `cd apps/api && npm run typecheck && npm run lint && npm run test && npm run build` — all green, no regressions

## 6. Web: reconciliation API client

- [x] 6.1 Add `apps/web/src/lib/api/reconciliation.ts` with `getSourceReconciliation(signal?)` and `getJobsReconciliation(signal?)` typed against `OperationResponse<'ReconciliationController_get_sources_v1'>` and `OperationResponse<'ReconciliationController_get_jobs_v1'>`
- [x] 6.2 Add `apps/web/src/lib/api/reconciliation.spec.ts` covering the typed client (following the pattern in `sources.spec.ts`)
- [x] 6.3 Add `reconciliation` keys to `apps/web/src/lib/api/query-keys.ts`

## 7. Web: Sources page jobs-health summary

- [x] 7.1 Extend `apps/web/src/components/sources/sources-page.tsx`: add a `useQuery` for `getSourceReconciliation` alongside the existing `listSources`/`listAdapters` queries; degrade gracefully on error (no summary line, page still renders)
- [x] 7.2 In `SourceRow`, render a compact `raw / processed / pending / failed / hidden` stat line using the row matching `source.id`; label it with a localized "across all runs" hint
- [x] 7.3 Add localized keys to `apps/web/messages/en.json` and `apps/web/messages/ua.json` under `sources.jobsSummary.*` (`raw`, `processed`, `pending`, `failed`, `hidden`, `allRunsHint`)
- [x] 7.4 Update `apps/web/src/components/sources/sources-page.spec.tsx` to cover: summary renders when the endpoint succeeds, summary is absent when the endpoint fails, per-row lookup by `sourceId`

## 8. Web: Jobs dashboard reconciliation strip

- [x] 8.1 Extend `apps/web/src/components/jobs/jobs-dashboard-summary.tsx`: add a `useQuery` for `getJobsReconciliation`; render a secondary strip below the existing metrics row with `discovered / processing / failed / hidden`
- [x] 8.2 Render `failed` as a `<Link href="/jobs/dead-letter">` only when non-zero; plain text otherwise
- [x] 8.3 Hide the entire strip when `discovered === 0` (fresh-install cleanliness)
- [x] 8.4 Degrade gracefully: if the reconciliation query fails, omit the strip; the existing metrics row and table render unchanged
- [x] 8.5 Add localized keys to `apps/web/messages/en.json` and `apps/web/messages/ua.json` under `jobs.dashboard.reconciliation.*` (`discovered`, `processing`, `failed`, `hidden`, `viewDeadLetter`)
- [x] 8.6 Update the existing `JobsDashboardSummary` component test (or add one) to cover: strip renders with correct buckets, strip is hidden when `discovered=0`, `failed` is a link only when non-zero, strip is absent on endpoint failure

## 9. Web: dead-letter listing route

- [x] 9.1 Add `apps/web/src/app/[locale]/jobs/dead-letter/page.tsx` as a Server Component that fetches `GET /v1/reconciliation/dead-letter` (the public dashboard-facing mirror — the automation endpoint is internal-token-guarded) and renders a simple table (external id, source slug, title, last attempt, attempts)
- [x] 9.2 Add a localized empty state when the list is empty (`jobs.deadLetter.empty`)
- [x] 9.3 Add localized column headers under `jobs.deadLetter.*` in `en.json` and `ua.json`
- [x] 9.4 Add a Playwright regression in `apps/web/e2e/` covering: navigate to `/en/jobs/dead-letter`, the page renders, the table (or empty state) is present

## 10. Web: gates + Playwright regressions

- [x] 10.1 Run `cd apps/web && npm run typecheck && npm run lint && npm run test && npm run build` — all green
- [x] 10.2 Add a Playwright regression for the Sources page asserting the jobs-health summary line is present on at least one row after seeding
- [x] 10.3 Add a Playwright regression for the Jobs dashboard asserting the reconciliation strip renders below the metrics row
- [x] 10.4 Run `npm run test:e2e` — all green (including the existing EN/UA/mobile jobs-rendering tests)

## 11. Live verification + wiki checkpoint

- [x] 11.1 Rebuild and redeploy the Docker stack (`docker compose -f infra/docker-compose.yml --profile services up -d --build`); confirm all four services are healthy
- [x] 11.2 Trigger a scrape run on one source via the Sources UI; observe the per-run counters and the new cumulative summary both update (the cumulative `raw` should grow, `pending` should grow, then `processed` should grow as the n8n chain processes)
- [x] 11.3 Open `/en/jobs` in a browser; confirm the reconciliation strip renders with correct buckets; click `failed` (if non-zero) and confirm navigation to `/en/jobs/dead-letter`
- [x] 11.4 Run `openspec validate --all` — all specs valid
- [x] 11.5 Update `wiki/pages/current-state.md` (new checkpoint), append to `wiki/log.md`, and update `PROGRESS.md` dated log
- [x] 11.6 Confirm git working tree status; do NOT commit unless the user explicitly asks (per repo convention)
