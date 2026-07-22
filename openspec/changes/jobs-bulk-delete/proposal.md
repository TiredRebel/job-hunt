## Why

The jobs table lets a user select multiple rows for bulk stage changes (mark applied, save, set stage, reject) but has no bulk delete — deleting more than one vacancy means clicking each row's delete icon one at a time. Separately, the job detail drawer's own destructive "Delete" button (bottom-right footer, present in both the drawer and full-page views) does delete the vacancy successfully but does not close the drawer afterward: live-verified just now — deleting a job from the drawer removed the row from the list within a second, but the drawer kept showing the deleted job's stale content for several seconds and only closed after an unrelated manual interaction (clicking the drawer's own X). Root cause traced to `job-detail.tsx`'s delete mutation: its `onSuccess` `await`s a broad `invalidateQueries({ queryKey: ['jobs'] })` before closing, and that invalidation also force-refetches this same component's own now-404ing detail query, which TanStack Query retries 3× with exponential backoff (~7s) before the awaited call resolves — so the close (and success toast) is delayed long enough to look broken. The existing list-row delete path (`jobs-client.tsx`) does not have this bug because it fires its invalidation without awaiting it.

## What Changes

- **Bulk delete for selected jobs**: the bulk action bar (summoned by row selection) gains a destructive "Delete" action using the same inline-confirm pattern already used for bulk Reject (click once to arm → "Confirm" → fires), consistent with this component's existing destructive-action UX — no native `window.confirm` for a multi-item action.
- **New gateway endpoint** `POST /v1/jobs/bulk-delete` (body `{ jobIds: string[] }`, response `{ deleted: number }`), mirroring the existing `POST /v1/reactions/bulk` pattern. A single `DELETE FROM core.jobs WHERE id = ANY($1)` query; ids that don't exist are silently skipped (`deleted` reflects only rows actually removed) rather than failing the whole batch.
- **Fix: job detail drawer closes immediately after a successful delete.** Reorder `job-detail.tsx`'s delete `onSuccess` so closing/navigating away (and the success toast) happen synchronously, and the broader `['jobs']` list invalidation is fired without blocking on it — matching the pattern the list-row delete path already uses correctly. Applies to both single-job delete (drawer and full page) and is the same fix bulk delete's own drawer-interaction relies on (closing the drawer if the open job is among the bulk-deleted set).
- **No schema migration**: `core.jobs.id` already has an index (primary key); `= ANY($1)` is an efficient set-membership delete.

## Capabilities

### New Capabilities

<!-- none — extends the existing job-deletion and jobs-dashboard capabilities -->

### Modified Capabilities

- `job-deletion`: the gateway SHALL additionally expose `POST /v1/jobs/bulk-delete` for deleting multiple vacancies by id in one request.
- `jobs-dashboard`: the bulk action bar SHALL additionally offer a destructive "Delete" action for the current selection, using an inline arm-then-confirm control; a successful bulk delete SHALL clear the selection and close the detail drawer if the open job was among the deleted ids.
- `job-detail`: after a successful single-job delete (drawer or full page), the view SHALL close/navigate away and show its success toast immediately, without waiting on unrelated cache invalidation.

## Impact

- **Backend (apps/api)**:
  - `JobRepository` port + `PostgresJobRepository`: new `deleteMany(ids: bigint[]): Promise<number>`.
  - `JobsService.bulkDelete()`, new `BulkDeleteJobsDto` (`jobIds: string[]`), new `POST /v1/jobs/bulk-delete` controller route.
  - New response type `BulkDeletedResponse` (mirrors existing `BulkInsertedResponse` in `common.response.dto.ts`).
  - OpenAPI schema regenerated; `packages/shared-ts` client regenerated.
- **Frontend (apps/web)**:
  - `bulk-action-bar.tsx`: new Delete button with arm/confirm state (mirrors the existing Reject control).
  - `jobs-client.tsx`: new bulk-delete mutation calling the new client function; on success, clears selection, closes the drawer if its open job id is in the deleted set, invalidates the jobs list without blocking the close/toast.
  - New `deleteJobs(ids: string[])` function in `lib/api/jobs.ts`.
  - `job-detail.tsx`: reorder the existing single-delete `onSuccess` (no new UI, behavior-only fix).
  - New `jobs.bulk.deleteConfirm`/`deleteSuccess`/`deleteError` i18n keys (or reuse existing `bulk.confirmReject`-style naming) in `en`/`uk`.
- **Tests**: component test for the bulk-delete control's arm/confirm/clear-selection behavior; gateway unit test for `bulkDelete`/`deleteMany`; extend `apps/web/e2e/job-delete.spec.ts` with a bulk-delete regression and a drawer-closes-after-delete regression (both gated on the existing CI-seeded fixtures, matching this file's established skip pattern).
- **No breaking changes**: the new endpoint is additive; the reordered `onSuccess` preserves all existing behavior (toast text, error handling, 404 mapping) and only changes timing.
