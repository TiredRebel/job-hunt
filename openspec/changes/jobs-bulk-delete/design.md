## Context

Two related but independent gaps in the existing job-deletion flow, both live-verified against the running stack before writing this plan:

- **No bulk delete.** `BulkActionBar` (`apps/web/src/components/jobs/bulk-action-bar.tsx`) already offers Mark applied / Save / Set stage / Reject for the current row selection, all routed through `POST /v1/reactions/bulk`. There is no equivalent for delete; `DELETE /v1/jobs/{id}` (`job-deletion` spec) only takes one id.
- **Drawer doesn't close after its own delete.** Confirmed live: opening a job's drawer, clicking its footer "Delete", and confirming does delete the vacancy (row count dropped, row disappeared from the list within ~1s), but the drawer kept rendering the deleted job's stale content, with `?job=<id>` still in the URL, for several seconds — closing (and the success toast appearing) only once an unrelated interaction (manually clicking the drawer's X) happened. Root cause, isolated by reading `job-detail.tsx`'s `deleteMutation`:

  ```js
  onSuccess: async (_result, title) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }); // ['jobs']
    queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    ...
    toast.success(...);
    if (onDeleted) { onDeleted(); return; }
    router.replace('/jobs');
  }
  ```

  `queryKeys.jobs.all` is `['jobs']`, a prefix match that also covers this same component's own actively-mounted `queryKeys.jobs.detail(jobId)` query. `invalidateQueries` refetches active matches, so it force-refetches the just-deleted job's own detail query — which now 404s. TanStack Query's `QueryProvider` (`apps/web/src/components/providers/query-provider.tsx`) sets no custom `retry`, so the default (3 retries, exponential backoff, ~1s/2s/4s ≈ 7s total) applies, and the `await` on `invalidateQueries` doesn't resolve until those retries exhaust. Everything after it — `removeQueries`, the toast, and `onDeleted()` (which clears the `?job=` param and is what actually closes the drawer) — is delayed by that same ~7s. The list-row delete path (`jobs-client.tsx`'s own `deleteMutation` → `invalidateJobs()`) does not have this bug: it calls `void queryClient.invalidateQueries(...)` without awaiting it, so its own `closeDeletedJob()` runs immediately.

## Goals / Non-Goals

**Goals:**

- Bulk-delete the current row selection in one action, following this component's established inline arm-then-confirm pattern for destructive bulk actions (already used for Reject) rather than a native `window.confirm`.
- Fix the drawer/full-page close-after-delete delay for single-job delete, and ensure bulk delete doesn't reintroduce the same class of bug (i.e., closing the drawer when the open job is among the deleted ids must not wait on the broader list invalidation either).
- Keep the fix minimal: this is a reordering/timing bug, not a logic bug — no new state, no new library.

**Non-Goals:**

- Undo/restore for bulk-deleted jobs (single delete already has no undo; bulk follows the same permanent-delete semantics per the `job-deletion` spec).
- Bulk delete across pages/filters beyond the current selection (selection is already scoped to loaded rows via existing `rowSelection` state — unchanged).
- Changing the retry/cache-invalidation strategy globally; the fix is scoped to this one `onSuccess` handler's ordering.

## Decisions

**D1 — New `POST /v1/jobs/bulk-delete` endpoint, mirroring `POST /reactions/bulk`.**
Body `{ jobIds: string[] }` (bigint-as-string, consistent with every other job-id-bearing DTO in this API), response `{ deleted: number }` via a new `BulkDeletedResponse` (mirrors the existing `BulkInsertedResponse` in `common.response.dto.ts`). Alternative considered: `DELETE /v1/jobs?ids=1,2,3` (query-string ids on the existing collection route) — rejected because a request body reads more naturally for an unbounded id list and matches the reactions-bulk precedent already established in this codebase, rather than introducing a second convention.

**D2 — Single SQL `DELETE FROM core.jobs WHERE id = ANY($1::bigint[]) RETURNING id`, count `rowCount` for `deleted`.**
One statement, not a loop of N single deletes — same transactional/cascade semantics as the existing single delete (FK cascades already handle job_matches/cover_letters/reaction_events/board_positions), just batched. IDs that don't exist are silently absent from the result; the endpoint does not fail the batch for partially-missing ids (distinct from single delete's 404, which is meaningful for one id but not for a batch where "some were already gone" is a normal, non-error outcome for a bulk UI action).

**D3 — Bulk delete confirmation follows the existing inline arm/confirm pattern (`BulkActionBar`'s Reject), not `window.confirm`.**
`BulkActionBar` already has this exact mechanism (`confirmingReject` state, click-to-arm then click-to-fire, `onBlur` resets it) for its one existing destructive action. Reusing it for Delete (a small generalization, e.g. a shared `useArmedConfirm` state per destructive action or two independent booleans) is more consistent and more testable than introducing `window.confirm` for a bulk action, and avoids the native-dialog blocking-render class of problem entirely for this new path.

**D4 — Fix the close-after-delete bug by reordering `onSuccess`, not by narrowing the invalidation key.**
New order in `job-detail.tsx`'s `deleteMutation.onSuccess`:

```js
onSuccess: async (_result, title) => {
  queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
  if (profileId) {
    queryClient.removeQueries({ queryKey: queryKeys.reactions.timeline(jobId, profileId) });
  }
  toast.success(tJobs('delete.success', { title }));
  if (onDeleted) {
    onDeleted();
  } else {
    router.replace('/jobs');
  }
  void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
};
```

`removeQueries` on the detail key runs first (so there's no cached data to consider stale), the toast and close/navigate happen synchronously with no `await` gating them, and the broader list invalidation is fired-and-forgotten last — exactly mirroring the already-correct list-row delete path. Alternative considered: narrow `queryKeys.jobs.all` to not prefix-match `jobs.detail` (e.g., restructure the key factory) — rejected as a much larger, riskier change touching every consumer of `queryKeys.jobs.all` (used elsewhere for reactions/status-change invalidation too) for no benefit over the simpler reordering fix, which fully explains and resolves the observed symptom.

**D5 — Bulk delete's own `onSuccess` follows the same "close/toast first, invalidate last" shape**, and additionally closes the drawer when its open job id is in the deleted set (via the same `closeDeletedJob`-style check `jobs-client.tsx` already does for single list-row delete, generalized to check membership in the deleted id array instead of equality with one id).

## Risks / Trade-offs

- **Silent partial failure in bulk delete** (some ids already gone, e.g. deleted by another tab) → by design (D2): `deleted` count reflects reality, no error surfaced for missing ids; the UI shows one success toast with the actual count, same spirit as the existing bulk-reactions endpoint's `inserted` count.
- **Reordering `onSuccess` changes when the toast appears relative to the background list invalidation** — the toast/close now happen before the list has necessarily finished refetching (though the list-row path already works this way today with no reported issue), so the jobs table updates a beat after the drawer closes rather than before. Acceptable: the row disappearing slightly after the drawer closes (vs. before) is not user-visible in practice and matches existing list-delete behavior exactly.
- **Fire-and-forget `invalidateQueries`** swallows a rejected promise silently if the background refetch fails outright (not just retries) — same as the existing, already-shipped list-row delete path, so no new risk class introduced.
