## Why

The `/sources` page can create, edit, enable/disable, test, and scrape a source, but there is no way to remove one. A source added by mistake (typo'd slug, wrong base URL, duplicate of another adapter) or one that's simply no longer needed can only be disabled — it stays in the list forever. Users need a way to permanently remove a source, matching the delete affordance already present on vacancies (`job-deletion`) and LLM providers.

## What Changes

- New gateway endpoint `DELETE /v1/sources/{slug}`, mirroring the existing `DELETE /v1/jobs/{id}` (`job-deletion`) shape: reuses the typed `DeletedResponse` (`{ deleted: true }`), 404 on an unknown slug.
- **Deletion is blocked (409) while the source has any associated data**: `core.jobs`, `scraper.jobs_raw`, and `scraper.scrape_runs` all have a `NOT NULL REFERENCES core.sources(id)` foreign key with no cascade, so a source that has ever been scraped cannot be removed without first losing that history. Rather than cascading the delete into job/scrape data (a much larger, unrequested blast radius), the endpoint only deletes sources with zero dependent rows; the error message names the counts and points at disabling the source instead.
- Each source row in the sources list gets a destructive "Delete" icon action (alongside the existing Edit/Test actions), confirmed via `window.confirm` naming the source — the same single-item confirmation convention used by job delete and LLM provider delete, not a new dialog component.
- **No schema migration and no cascade change**: the existing FK constraints are relied on as-is; the new delete query only succeeds when they're already satisfied (no dependents).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `sources-admin`: the `/sources` page SHALL additionally offer a destructive per-row "Delete" action calling `DELETE /v1/sources/{slug}`, confirmed before the request is sent; deletion SHALL be rejected with 409 while the source has any associated jobs, raw jobs, or scrape runs, and the UI SHALL surface that as an error explaining the source must be emptied or disabled instead.

## Impact

- **Backend (apps/api)**:
  - `SourceRepository` port + `PostgresSourceRepository`: new `delete(slug): Promise<'deleted' | 'not_found' | 'in_use'>`, a single guarded `DELETE ... WHERE slug = $1 AND NOT EXISTS (dependent rows) RETURNING id`, race-safe by construction (no separate check-then-act transaction needed), same shape as the LLM provider's `AND NOT is_active` guard.
  - `SourcesService.delete()` mapping `'not_found'` → `NotFoundException`, `'in_use'` → `ConflictException` (with dependent counts in the message), `'deleted'` → `DeletedResponse`.
  - New `DELETE /v1/sources/:slug` route on `SourcesController`.
  - OpenAPI schema regenerated; `packages/shared-ts` client regenerated.
- **Frontend (apps/web)**:
  - New `deleteSource(slug)` in `lib/api/sources.ts`.
  - `sources-page.tsx`: new delete mutation on `SourceRow` (icon button next to Edit/Test), `window.confirm` naming the source, invalidates `queryKeys.sources.all` (and `queryKeys.reconciliation.sources`) on success, error toast (surfacing the 409 message) on failure.
  - New `sources.deleteLabel`/`deleteConfirm`/`deleteSuccess`/`deleteError` i18n keys in `en`/`uk`.
- **Tests**: gateway service test for `delete` (deleted / not found / in-use), repository test for the guarded delete query if repository tests exist for this file already, component test for the row delete action's confirm/cancel/success/error behavior.
- **No breaking changes**: the new endpoint and UI action are additive.
