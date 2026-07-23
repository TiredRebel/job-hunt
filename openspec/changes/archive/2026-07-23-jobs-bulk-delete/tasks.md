## 1. Fix: drawer/full-page closes immediately after single delete

- [x] 1.1 In `apps/web/src/components/jobs/job-detail.tsx`, reorder `deleteMutation`'s `onSuccess`: run `queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) })` (and the reaction-timeline `removeQueries`) first, then `toast.success(...)`, then `onDeleted()`/`router.replace('/jobs')`, and only then fire `queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all })` **without** `await` (`void queryClient.invalidateQueries(...)`), matching `jobs-client.tsx`'s already-correct list-row delete pattern.
- [x] 1.2 Verify no other consumer relied on the invalidate completing before the toast/close (grep usages of this `onSuccess` path) — none expected, since `onDeleted`/`router.replace` were already the last two branches. Confirmed: `job-drawer.tsx` passes `onDeleted={clearJobParam}`, the full-page route (`jobs/[id]/page.tsx`) passes no `onDeleted` (falls back to `router.replace('/jobs')`) — neither depended on the invalidate settling first.

## 2. Backend: bulk-delete endpoint

- [x] 2.1 Add `deleteMany(ids: readonly bigint[]): Promise<number>` to `JobRepository` port (`apps/api/src/application/ports/job-repository.port.ts`).
- [x] 2.2 Implement `deleteMany` in `PostgresJobRepository`: `DELETE FROM core.jobs WHERE id = ANY($1::bigint[]) RETURNING id` inside `this.db.transaction(...)`, return `result.rowCount`. Empty `ids` array short-circuits to `0` without a query.
- [x] 2.3 Add `JobsService.bulkDelete(ids: bigint[]): Promise<number>` calling the repository method.
- [x] 2.4 Add `BulkDeleteJobsDto` in `apps/api/src/jobs/jobs.dto.ts` (`jobIds: string[]`, allows empty arrays per the spec's empty-list scenario — matches `BulkReactionsDto`'s validation style, no min-size constraint).
- [x] 2.5 Add `BulkDeletedResponse` to `apps/api/src/common/common.response.dto.ts` (mirrors `BulkInsertedResponse`, field `deleted: number`).
- [x] 2.6 Add `POST /jobs/bulk-delete` to `JobsController`, calling `service.bulkDelete(payload.jobIds.map(BigInt))`, returning `{ deleted }`, `@HttpCode(200)` per spec. Different HTTP method (POST) than `@Delete(':id')`/`@Get(':id')` so no route-shadowing is possible regardless of order; placed immediately before `@Delete(':id')` for readability.
- [x] 2.7 Add a gateway unit test (`jobs.service.spec.ts` or new `postgres-job.repository.spec.ts` if one exists) covering: all-existing ids, some-missing ids, empty array. Added to `jobs.service.spec.ts` (no repository-spec file exists for any repository in this codebase); `FakeJobRepository` gained a `deleteMany` implementation. 14/14 tests pass.

## 3. OpenAPI + shared-ts regeneration

- [x] 3.1 Run `cd apps/api && npm run build` then the repo's OpenAPI emit script; verify the new operation and `BulkDeletedResponse`/`BulkDeleteJobsDto` schemas appear.
- [x] 3.2 Run `cd packages/shared-ts && npm run generate && npm run build`; verify the typed client includes the new operation (the `build` script alone only runs `tsc` — regenerating the client from `openapi.json` requires the separate `generate` script).

## 4. Frontend: API client

- [x] 4.1 Add `deleteJobs(ids: string[]): Promise<{ deleted: number }>` to `apps/web/src/lib/api/jobs.ts`, calling `POST /jobs/bulk-delete` with `{ jobIds: ids }`.

## 5. Frontend: bulk action bar Delete control

- [x] 5.1 In `apps/web/src/components/jobs/bulk-action-bar.tsx`, add a destructive "Delete" button using the same arm-then-confirm pattern as the existing Reject button (separate `confirmingDelete` state, `onBlur` resets it, label toggles to `tCommon('confirm')` when armed).
- [x] 5.2 Add `onDelete: () => void` to `BulkActionBarProps` and wire the new button to it.

## 6. Frontend: wire bulk delete into the jobs page

- [x] 6.1 In `apps/web/src/components/jobs/jobs-client.tsx`, add a `bulkDeleteMutation` calling `deleteJobs(selectedIds)`. `onSuccess`: clear `rowSelection` and `focusedJobId` if it was among the deleted ids, close the drawer if `rawSearchParams.get('job')` is among the deleted `jobIds` (reuse `closeDeletedJob`), `toast.success` with the deleted count, then invalidate the jobs list **without** awaiting (fire-and-forget, via the existing `invalidateJobs()` helper). `onError`: `toast.error`, selection untouched (preserved).
- [x] 6.2 Pass `onDelete={() => bulkDeleteMutation.mutate(selectedIds)}` to `<BulkActionBar>` (also folded `bulkDeleteMutation.isPending` into the bar's combined `pending` prop).

## 7. Localization

- [x] 7.1 Add `jobs.bulk.delete`, `jobs.bulk.deleteSuccess`, `jobs.bulk.deleteError` keys to `apps/web/messages/en.json`. (No separate `confirmBulkDelete` text needed — the bulk bar's Reject control doesn't display `confirmReject` either; the inline arm/confirm cycle just swaps the button label to `common.confirm`, which Delete follows too.)
- [x] 7.2 Add the same keys to `apps/web/messages/uk.json`.

## 8. Tests

- [x] 8.1 Add/extend a `bulk-action-bar.spec.tsx` (or add to an existing jobs component spec) covering: Delete requires arming before firing, confirming calls `onDelete`, `onBlur` resets the armed state. New file, 5 tests, all pass.
- [x] 8.2 Add a `jobs-client`-level test or extend existing coverage for: bulk delete clears selection on success, closes the drawer when the open job was deleted, preserves selection on failure. New `jobs-client.spec.tsx` (first test file for this component); heavy/unrelated children (filter bar, dashboard summary, pagination, table internals) stubbed. 3/3 tests pass.
- [x] 8.3 Extend `apps/web/e2e/job-delete.spec.ts` with: a bulk-delete regression and a single-delete drawer-closes-promptly regression (`toBeHidden({ timeout: 2_000 })` — the ~7s bug would fail this). **Flag:** the drawer-close test reuses the existing "CI E2E Delete Job list" fixture (safe — placed last, after every other consumer only ever cancels/reads it); the bulk-delete test needs two _new_ fixtures, "CI E2E Bulk Delete Job 1"/"2", since the three existing named fixtures are each consumed for real by earlier tests in this same file by the time it runs. This repo's CI fixture-seeding step lives outside this repo (not found in it) — whoever maintains that seeding needs to add these two titles for the new bulk-delete test to run in CI; locally and until then it skips gracefully like every other test in this file.

## 9. Gates

- [x] 9.1 Run `cd apps/api && npm run typecheck && npm run lint && npm run test && npm run build` — all green. Along the way: fixed two other `FakeJobRepository`/`FakeJobRepository`-shaped fakes (`cover-letters.service.spec.ts`) missing the new `deleteMany` method (typecheck ripple from extending the port), and a pre-existing, unrelated lint error in `reconciliation.service.spec.ts` (unused params on a fake's `markProcessed`, from earlier uncommitted work) that blocked the lint gate. 150/150 tests pass.
- [x] 9.2 Run `cd apps/web && npm run typecheck && npm run lint && npm run test && npm run build` — all green. Added a `deleteJobs` case to the existing `jobs.spec.ts` contract-test file (brought `jobs.ts` to 100% coverage). 106/106 tests pass; the remaining functions-coverage shortfall (72.15%/80%) is the same pre-existing gap flagged during the pagination change (untested `automation.ts`/`dictionaries.ts`/`profiles.ts`/`reactions.ts`/hooks from earlier uncommitted work) — unrelated to this change, which only adds coverage.
- [x] 9.3 Run `npm run test:e2e` — all green for everything this change touches (23 passed, including `jobs-pagination`, `jobs-rendering`, `jobs-happy-path`, `reconciliation`). All 11 `job-delete.spec.ts` tests (9 existing + 2 new) skip gracefully — no CI fixtures seeded in this local dev DB, same as every other test in that file; no syntax/runtime errors. 2 pre-existing, unrelated `board-reorder.spec.ts` failures (need a different CI-only "CI E2E Seed Job" fixture) — same failures observed and flagged during the earlier pagination change, confirmed unrelated to this change.
- [x] 9.4 Live-verify against the running Docker stack: rebuild/redeploy `api` and `web`, then repeat the manual repro from this proposal (open a job's drawer, delete, confirm the drawer closes within ~1s, not ~7s) and a bulk-delete pass on 2+ selected rows. Both verified live: deleted "React Native Developer" (score 0, dou) via the drawer — closed immediately with the success toast, no stale content, no multi-second delay. Bulk-deleted "Backend Developer (Node.js / NestJS)" + "Full Stack Developer / newage." (both score 0, dou) via the bulk bar's arm→confirm Delete control — both rows gone, selection cleared, toast read "Deleted 2 jobs".
- [x] 9.5 `openspec validate jobs-bulk-delete --strict` passes; confirm git working tree; do NOT commit unless the user asks. Working tree shows exactly the expected files changed; `graphify-out/*` remains untouched/unstaged (same unexplained changes flagged and excluded in earlier commits this session). Not committed.
