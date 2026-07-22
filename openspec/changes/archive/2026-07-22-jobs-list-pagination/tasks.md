## 1. Pagination component

- [x] 1.1 Add `apps/web/src/components/jobs/jobs-pagination.tsx` — a client component taking `{ params: JobsListParams; total: number }`. Compute `limit = params.limit ?? DEFAULT_JOBS_LIMIT`, `offset = params.offset ?? 0`, `currentPage = Math.floor(offset / limit)`, `pageCount = Math.max(1, Math.ceil(total / limit))`, `from = total === 0 ? 0 : offset + 1`, `to = Math.min(offset + limit, total)`.
- [x] 1.2 Render a page-size `Select` (`@/components/ui/select`) with options 20/50/100 bound to `limit`; on change, write the new `limit` with `offset` reset to 0.
- [x] 1.3 Render Previous / Next `Button`s (`@/components/ui/button`): Previous sets `offset = Math.max(0, offset - limit)` and is `disabled` when `offset === 0`; Next sets `offset = offset + limit` and is `disabled` when `offset + limit >= total`.
- [x] 1.4 Render the localized range readout ("{from}–{to} of {total}") and page indicator; return `null` when `total === 0`.
- [x] 1.5 Drive all URL writes through `router.replace` using `jobsListParamsToSearchParams` and preserve the `job` drawer param if present (mirror `FilterBar.applyPatch`).

## 2. Wire into the jobs page

- [x] 2.1 In `apps/web/src/components/jobs/jobs-client.tsx`, render `<JobsPagination params={params} total={total} />` below the table scroll container (only when not in the empty state).
- [x] 2.2 Confirm `useJobsQuery` refetches on `limit`/`offset` change (it is keyed on `params`; no code change expected — verify).

## 3. Localization

- [x] 3.1 Add `jobs.pagination.*` keys to `apps/web/messages/en.json` (`pageSize`, `perPage`, `previous`, `next`, `range` with `{from}/{to}/{total}` ICU args, `page` with `{page}/{count}`).
- [x] 3.2 Add the same keys to `apps/web/messages/uk.json` with Ukrainian copy.

## 4. Tests

- [x] 4.1 Add `apps/web/src/components/jobs/jobs-pagination.spec.tsx` covering: default 20 renders "1–20 of N"; selecting 100 writes `limit=100`&`offset=0`; Next from page 1 writes `offset=limit`; Previous disabled at `offset=0`; Next disabled when `offset+limit>=total`; returns null when `total=0`.
- [x] 4.2 Add a Playwright regression in `apps/web/e2e/` (extend `jobs-rendering.spec.ts` or add `jobs-pagination.spec.ts`): change page size to 50 and assert URL `limit=50`; click Next and assert URL `offset=50` and the range readout updates.

## 5. Gates

- [x] 5.1 Run `cd apps/web && npm run typecheck && npm run lint && npm run test && npm run build` — all green. (Coverage's `functions` threshold fails at 74.32%/80%, but this is pre-existing and unrelated: the `include` scope is `src/lib/**` only, which this change never touches — the shortfall is 0%-covered files from earlier uncommitted work, e.g. `automation.ts`.)
- [x] 5.2 Run `npm run test:e2e` — all green for everything this change touches or could affect (15 passed: `jobs-pagination`, `jobs-rendering` EN/UK/mobile, `jobs-happy-path`, `reconciliation`). 2 pre-existing failures in `board-reorder.spec.ts` are unrelated: that spec requires 3 CI-seeded fixture jobs matching a specific search term, which this ad-hoc live dev DB never had. 10 `job-delete.spec.ts` tests skipped for the same reason.
- [x] 5.3 `openspec validate jobs-list-pagination --strict` passes; confirm git working tree; do NOT commit unless the user asks.
