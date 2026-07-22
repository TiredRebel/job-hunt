## Why

The `/jobs` table renders only the first page of results (default 20 rows) with no way to move past it or change how many rows load at once — a user with 245 discovered jobs can see 20 of them and no more. The backend already paginates fully (`limit` 1–100, `offset`, and a `total` count are all live on `GET /v1/jobs`) and the URL already round-trips `limit`/`offset`; the page just never renders a control to drive them. This is a missing UI on top of complete plumbing.

## What Changes

- **Page-size selector on the jobs table**: a control offering `20 / 50 / 100` rows per page, defaulting to the existing `DEFAULT_JOBS_LIMIT` of 20. Changing it writes `limit` to the URL and resets `offset` to 0 (page 1).
- **Pagination controls**: Previous / Next navigation plus a "showing X–Y of Z" range readout, derived from the existing `total` in the list response. Previous is disabled on page 1; Next is disabled on the last page.
- **URL-persisted paging state**: page size and offset already serialize to the URL (`?limit=…&offset=…`) via `jobsListParamsToSearchParams`; the new controls drive that same round-trip so a paged view is shareable and survives reload, exactly like filters and sort do today.
- **Offset resets on filter/sort/page-size change**: any filter change already zeroes `offset` (via `FilterBar.applyPatch`); the page-size selector follows the same rule so you never land on an out-of-range page.
- **Localized copy** for the new labels under a new `jobs.pagination.*` namespace in `en`/`uk`.
- **No backend, DB, or API changes**: `limit` (max 100) and `offset` are already validated and served; `total` is already returned. `20 / 50 / 100` fit the existing `Max(100)` constraint exactly.

## Capabilities

### New Capabilities

<!-- none — this extends the existing jobs-dashboard capability -->

### Modified Capabilities

- `jobs-dashboard`: the `/jobs` page SHALL additionally render a page-size selector (`20/50/100`) and Previous/Next pagination with a result-range readout, all URL-persisted, layered on the existing server-driven `limit`/`offset` pagination.

## Impact

- **Frontend (apps/web)** — the whole change lives here:
  - New `JobsPagination` component (page-size `Select` + Prev/Next buttons + range readout), rendered by `jobs-client.tsx` below the table.
  - `jobs-client.tsx` passes `total` and current `params` down; the component writes `limit`/`offset` to the URL via `router.replace` (the pattern `JobTable` already uses for sort and `FilterBar` uses for filters).
  - New `jobs.pagination.*` keys in `messages/en.json` and `messages/uk.json`.
  - Reuses existing `@/components/ui/select`, `@/components/ui/button`, `search-params.ts` serialization, and `useJobsQuery` (already keyed on `params`, so a URL change refetches the right page).
- **Tests**: a component test for `JobsPagination` (page-size change resets offset; Prev/Next bounds; range math) and a Playwright regression asserting the selector and Prev/Next work end-to-end.
- **No changes** to `apps/api`, the database, the OpenAPI schema, `packages/shared-ts`, the scraper, LLM service, or n8n.
