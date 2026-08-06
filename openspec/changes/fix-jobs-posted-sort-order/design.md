## Context

The Jobs table renders its Posted value through a shared formatter that uses `postedAt` when a source confirms a publication date and falls back to `firstSeenAt` otherwise. The list repository currently orders `sortBy=posted` by `j.posted_at` alone with `NULLS LAST`; consequently a row rendered as “Aug 6” from the fallback is ordered after every row with a non-null, older source date. The list query is server-paginated, so client-side correction cannot repair the sequence across pages.

## Goals / Non-Goals

**Goals:**

- Ensure the server’s Posted ordering matches the value the Jobs table displays.
- Preserve a stable, reproducible order for equal dates across offset pages.
- Cover the reported mixed-source/fallback ordering regression.

**Non-Goals:**

- Populate missing `posted_at` values, alter source-date parsing, or change the meaning of `postedAt`.
- Change the default `lastSeen` order, date-range filtering, pagination protocol, or public API shape.
- Add a new database column or a client-side sorting pass.

## Decisions

### D1: Use an effective display date only for Posted sorting

For `sortBy=posted`, the repository will order by `COALESCE(j.posted_at, j.first_seen_at)`. `first_seen_at` is already present for every normalized job, and this expression exactly mirrors the table’s display contract without writing a fallback into `posted_at`.

Alternatives considered:

- Backfill `posted_at` with `first_seen_at`: rejected because `postedAt` must remain authentic source metadata.
- Sort in the browser: rejected because the API returns one offset page at a time, so the browser cannot order unseen rows correctly.
- Expose a new derived API field: rejected because the existing fields already express the required display value and no external contract needs to change.

### D2: Retain the existing unique ID tie-breaker

The list query will continue to apply its unique `j.id` secondary ordering after the effective date. That makes equal calendar dates deterministic and prevents offset pages from reordering tied rows between requests.

Alternative considered:

- Order tied rows only by the date: rejected because PostgreSQL is not required to return a stable order for equal sort values, which can produce duplicates or apparent jumps at page boundaries.

### D3: Test the generated ordering at the repository boundary

Add focused repository/query coverage that verifies the Posted ordering expression and secondary key, then exercise an ordered fixture set through consecutive offsets. Keep formatter tests as the display contract; no component behavior needs to change for this correction.

Alternative considered:

- Test only the UI header state: rejected because it cannot prove the server order over records on different pages.

## Risks / Trade-offs

- [Fallback values are scraper observation timestamps rather than source publication dates] → The fallback remains explicitly display-only metadata; it is used for ordering only when the user requests the Posted view because that is the date the table shows.
- [An expression sort can be less index-friendly than a single column] → The jobs list is bounded to at most 100 rows per page and existing filtering is applied before ordering; measure query performance before considering an expression index.
- [New source dates can arrive between page requests] → The stable ID tie-breaker prevents ambiguity for equal effective dates, but offset pagination cannot provide a snapshot across concurrent writes; this is existing pagination behavior and outside this change.

## Migration Plan

1. Deploy the API repository change with its regression tests.
2. Reload the Jobs page or repeat the existing `GET /v1/jobs?sortBy=posted&sortDir=desc` request; no data migration or cache invalidation is required.
3. If a regression is found, roll back the single Posted sort expression to `j.posted_at`; no persisted state needs restoration.
