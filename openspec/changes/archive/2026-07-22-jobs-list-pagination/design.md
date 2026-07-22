## Context

The `/jobs` page is already built for server-driven pagination end to end — the only missing piece is a control to drive it:

- **API**: `GET /v1/jobs` (`ListJobsQueryDto`) accepts `limit` (`@Min(1) @Max(100)`, default 20) and `offset` (`@Min(0)`, default 0), and `PaginatedJobs` returns `{ items, total }`. `PostgresJobRepository.findMany` runs a `COUNT(*)` alongside the page query, so `total` is a real filtered count.
- **URL**: `parseJobsSearchParams` reads `limit` (falling back to `DEFAULT_JOBS_LIMIT = 20`) and `offset` (default 0); `jobsListParamsToSearchParams` writes them back, omitting `limit` when it equals the default and `offset` when 0 (clean URLs). Round-trip is already lossless.
- **Data flow**: the server component (`force-dynamic`) fetches page 1 for the current URL params and hands it to `JobsClient` as `initialData`; `useJobsQuery(params, initialData)` is keyed on the full `params` object (which includes `limit`/`offset`), so any URL change refetches the correct page. This is exactly how sort already works via `JobTable.handleSortingChange` → `router.replace`, and how filters work via `FilterBar.applyPatch` → `router.replace` (which already sets `offset: 0`).
- **Gap**: nothing renders `limit`/`offset` controls. `JobsClient` exposes `total` only through an `sr-only` live region; `JobTable`'s footer shows a raw result count. A user cannot leave page 1 or change page size.

## Goals / Non-Goals

**Goals:**

- Let the user choose 20/50/100 rows per page and move Previous/Next through the full result set.
- Keep paging state in the URL (shareable, reload-safe) using the existing serialization.
- Reuse the established `router.replace`-from-a-client-component pattern; add no new state store, no new dependency, no backend change.

**Non-Goals:**

- Numbered page links / "jump to page N" (Prev/Next + range readout is enough for a personal dashboard; can be added later without rework).
- Infinite scroll or cursor pagination (offset paging is already in place and adequate at ≤100/page).
- Changing the `Max(100)` server cap or the virtualization threshold (200) — with a 100-row max page, virtualization simply never triggers, which is fine.
- Persisting page size across sessions (localStorage/profile) — URL persistence covers shareability; a durable per-user default is out of scope.

## Decisions

**D1 — One new presentational component, `JobsPagination`, driven by the URL.**
It receives `total` and the current `params` (both already in `JobsClient`) and, like `FilterBar`, uses `useRouter`/`usePathname`/`useSearchParams` + `jobsListParamsToSearchParams` to write `limit`/`offset`. Rationale: mirrors the existing sort/filter pattern exactly; no new plumbing, no lifted state. Alternative (local React state) rejected — it would desync from the URL and break shareable/reload-safe paging that the rest of the page relies on.

**D2 — Page-size change resets `offset` to 0.**
Reuse `FilterBar.applyPatch`'s rule: building the next params always sets `offset: 0` when `limit` changes. Rationale: switching from 100/page on page 3 to 20/page must not leave `offset=200` pointing past the result set. Alternative (preserve the first visible row's index) rejected as over-engineering for no real benefit.

**D3 — Prev/Next computed from `offset`, `limit`, `total`; bounds enforced in the component.**
`currentPage = floor(offset/limit)`, `pageCount = max(1, ceil(total/limit))`. Prev sets `offset = max(0, offset - limit)` and is disabled when `offset === 0`; Next sets `offset = offset + limit` and is disabled when `offset + limit >= total`. Range readout: `total === 0 ? none : "{from}–{to} of {total}"` with `from = offset + 1`, `to = min(offset + limit, total)`. Rationale: pure arithmetic over data already in hand; no extra request.

**D4 — Placement below the table, inside `JobsClient`.**
Rendered as a footer row after the scroll container (a sibling of `JobTable`), so it stays visible and is not affected by the table's internal virtualization/scroll. Hidden entirely when `total === 0` (the empty state already communicates "no results"). Rationale: keeps `JobTable` a pure renderer (its doc comment says it "only renders and reports interaction intents"); pagination is page-level orchestration, which is `JobsClient`'s job.

**D5 — Page size lives in the existing `limit` param; no new URL key.**
`?limit=50&offset=100` already parses and serializes. The selector's allowed values (20/50/100) are validated client-side against a constant; an out-of-range or garbage `limit` in the URL still passes through `parseNumberParam` and is clamped by the server's `@Max(100)` / `@Min(1)`, so a hand-edited URL can't break the page. Rationale: single source of truth already exists.

## Risks / Trade-offs

- **A hand-edited `?limit=999` or `?offset=-5`** → the server DTO clamps (`@Max(100)`, `@Min(1)`, `@Min(0)`) and the component derives bounds from the returned `total`, so the worst case is a clamped page, not a crash. The selector only ever emits 20/50/100.
- **`offset` past the end** (e.g. filters narrowed the set while `offset` was large) → `findMany` returns an empty `items` with the real `total`; the range readout and disabled-Next reflect it, and the user can page back. Filter changes already reset `offset` to 0, so this is an edge case only reachable by manual URL editing.
- **Extra `router.replace` navigations** → identical in cost to the existing sort/filter interactions (server re-render + one refetch); no new performance surface.
- **Trade-off: Prev/Next instead of numbered pages** → slightly more clicks to reach a distant page, but far simpler and sufficient for the expected result sizes; numbered pages can be added to the same component later without touching the data flow.
