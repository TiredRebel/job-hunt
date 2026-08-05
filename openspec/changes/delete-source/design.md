## Context

`core.sources` is referenced by three `NOT NULL` foreign keys with no `ON DELETE` clause (default `NO ACTION`): `core.jobs.source_id`, `scraper.jobs_raw.source_id`, `scraper.scrape_runs.source_id` (`infra/db/migrations/0001_sources_and_jobs.sql`). Unlike `core.jobs`, which cascades cleanly into its own dependents (`job-deletion`), the FK direction here means a source cannot be deleted at all once anything has been scraped from it — the database will reject it. `SourcesService`/`SourceRepository`/`SourcesController` currently only support list/get/create/update/setEnabled/test/triggerScrape/runs; there is no delete method anywhere in that stack. `DeletedResponse` (`{ deleted: boolean }`) already exists in `common.response.dto.ts`, added for `DELETE /v1/jobs/:id` and unused elsewhere.

## Goals / Non-Goals

**Goals:**

- Let a source be permanently removed when it has no associated data, following the same typed-endpoint and confirmation conventions already established by `job-deletion` and the LLM provider delete (`llm-provider-delete-and-model-picker`).
- Make the guard against deleting a source with data race-safe by construction, not a separate check-then-act step.

**Non-Goals:**

- Cascading the delete into `core.jobs` / `scraper.jobs_raw` / `scraper.scrape_runs` for that source. That's a much larger, unrequested deletion (all vacancy/scrape history for the source) and is not what "remove a source" was asked for; a source with real history stays removable only by disabling it.
- Any schema migration or change to the existing FK constraints.
- Bulk source deletion (sources list has no row-selection UI, unlike the jobs table).

## Decisions

### D1 — `DELETE /v1/sources/{slug}` on the gateway, reusing `DeletedResponse`

Add `delete(slug)` to `SourceRepository`, expose it through `SourcesService.delete()`, add `DELETE /:slug` to `SourcesController`. Returns `DeletedResponse` (`{ deleted: true }`) on success, matching `job-deletion`'s convention (chosen over the LLM provider's bare 204 because Sources lives in the same gateway as Jobs and already has this exact typed response available — one convention for gateway-native Postgres deletes, not two).

**Alternative considered:** Bare 204 No Content (the LLM provider's style). Rejected — that pattern exists because provider delete proxies to a separate microservice; sources delete is a direct Postgres operation in `apps/api`, same as jobs delete, so it should match that convention instead.

### D2 — Single guarded `DELETE ... WHERE slug = $1 AND NOT EXISTS(dependents) RETURNING id`; repository returns a three-way result

```sql
DELETE FROM core.sources s
WHERE s.slug = $1
  AND NOT EXISTS (SELECT 1 FROM core.jobs j WHERE j.source_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM scraper.jobs_raw jr WHERE jr.source_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM scraper.scrape_runs sr WHERE sr.source_id = s.id)
RETURNING id
```

The `NOT EXISTS` guards make the delete itself race-safe — a concurrent insert into any dependent table loses nothing; the delete simply affects 0 rows, exactly mirroring the LLM provider's `AND NOT is_active` predicate (D3 of `llm-provider-delete-and-model-picker`). If 0 rows are affected, a follow-up `findBySlug` disambiguates 404 (slug unknown) from "in use" (slug exists, guard failed) — two queries, no transaction needed, same shape as the provider's `get_provider`-then-`delete_provider` pair. `SourceRepository.delete(slug)` returns `'deleted' | 'not_found' | 'in_use'`; `SourcesService.delete()` maps these to `DeletedResponse` / `NotFoundException` / `ConflictException` respectively — the repository stays framework-free (no Nest exceptions), matching this port's existing null-return convention for not-found (`update`/`setEnabled`).

**Alternative considered:** Catch the driver's `23503` foreign_key_violation error code after a plain `DELETE`. Rejected — no code in this repository catches raw Postgres error codes today; every other conflict (`create`'s duplicate slug) is handled with a SQL-level guard (`ON CONFLICT DO NOTHING` + null check) instead, and the `NOT EXISTS` guard is that same style applied to delete.

**Alternative considered:** Pre-count dependents in a separate read, then delete only if zero. Rejected — introduces a check-then-act race window the single guarded statement doesn't have, for no benefit.

### D3 — `ConflictException` message includes what's blocking it

`SourcesService.delete()` on `'in_use'` throws `ConflictException` with a message naming the slug (e.g. "Source 'dou' has associated jobs or scrape runs and cannot be deleted; disable it instead"). Exact per-table counts are not fetched — the guard query already tells us only "blocked or not", and a second query purely to report counts in an error string is not worth the extra round trip. The web app displays the server's message as-is via the existing `ApiError`/toast convention (`onError: () => toast.error(...)` pattern already used for `enableMutation`/`scrapeMutation`/`testMutation` in `sources-page.tsx`), so no new error-parsing logic is needed.

### D4 — UI: per-row destructive icon action, `window.confirm`, no new dialog component

Add a `Trash2` icon button to `SourceRow`'s existing action group (next to the `Pencil` edit and `Zap` test buttons — same row, same icon-button styling), not a footer button inside `SourceFormDialog`. The sources list is already row-action-oriented (Edit, Test, Run now all live on the row); putting Delete there matches this page's own idiom rather than importing the LLM provider's dialog-footer idiom from a different page. Confirmation is `window.confirm` naming the source, consistent with both `job-deletion`'s and the LLM provider's single-item delete confirmation (bulk actions use an inline arm/confirm control instead — not applicable here, this page has no multi-select).

No client-side pre-check of "does this source have data" before offering Delete: the reconciliation summary already on the row (`rawTotal`/`processed`/...) doesn't cover `scraper.scrape_runs` (a source can have run rows with zero raw jobs found), so it can't reliably predict the 409 anyway. The button is always enabled; the 409 (when it happens) is reported the same way any other mutation error already is on this row.

**Alternative considered:** Disable the Delete button up front when reconciliation shows nonzero `rawTotal` (mirroring the LLM provider's disabled-for-active button). Rejected — would need an extra always-on runs-count fetch per row (currently only fetched when a row is expanded) to be accurate, for a check the server already makes authoritatively in one guarded query.

### D5 — Cache invalidation on success

`onSuccess` invalidates `queryKeys.sources.all` and `queryKeys.reconciliation.sources` (the row disappears; reconciliation had an entry for it), then shows a success toast — same shape as `enableMutation`'s `onSuccess`.

## Risks / Trade-offs

- **[Confusing dead end for a source with real history]** → 409 is common, not an edge case, for any source that's actually been scraped. Mitigated by D3's message explicitly naming "disable it instead" as the alternative, since disabling already exists and does what most users actually want (stop scraping without losing history).
- **[`window.confirm` blocks the render thread]** → Same accepted trade-off as the two existing single-item delete precedents (`job-deletion`, LLM provider delete); not a new risk class.
- **[Guard query cost]** → Three `NOT EXISTS` subqueries per delete attempt. `core.jobs` and `scraper.jobs_raw` get an index usable for `source_id =` lookups for free from their existing `UNIQUE(source_id, ...)` constraints; `scraper.scrape_runs.source_id` has no index at all today (verify during task 1.1) and that subquery would sequential-scan the table. Delete is a low-frequency admin action on tables this project's scale keeps small, so add an index only if verification shows it's actually needed — not preemptively.
