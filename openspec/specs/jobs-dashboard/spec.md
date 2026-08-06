# jobs-dashboard

## Purpose

The `/jobs` page: a filterable, sortable, keyboard-first jobs table with URL-persisted filter state, bulk stage actions, and navigation into job detail.

## Requirements

### Requirement: Filterable jobs table

The `/jobs` page SHALL render vacancies in a dense table (TanStack Table) with columns: selection checkbox, score, title+company, source, salary, tags (≤3 visible + "+N"), posted date, stage. Score, posted and salary columns SHALL be sortable; a column-visibility menu SHALL allow hiding columns. Filtering, sorting and pagination SHALL be server-driven via `GET /v1/jobs` query parameters. The table SHALL virtualize rows above 200 items while preserving table semantics (`aria-sort`, announced row selection). When the user sorts by the Posted column, the server SHALL order each job by the same effective date rendered in that column: its authentic source publication date when present, otherwise its first-seen date. The resulting order SHALL be deterministic so offset-based pages form one continuous sorted sequence.

#### Scenario: Default listing

- **WHEN** the user opens `/jobs` with no filters
- **THEN** the first page of jobs renders server-side with score badges tinted by the semantic score scale and monospace tabular numerals for scores, salaries and dates

#### Scenario: Sorting by score

- **WHEN** the user clicks the score column header
- **THEN** the table refetches with the corresponding sort parameter and the header exposes `aria-sort`

#### Scenario: Sorting by Posted uses the displayed fallback date

- **WHEN** the user sorts Posted descending and a job without an authentic publication date displays its August 6 first-seen fallback while another job displays an authentic August 5 publication date
- **THEN** the August 6 row appears before the August 5 row

#### Scenario: Posted order remains continuous across pages

- **WHEN** the user moves between offset-based pages of a Posted-sorted result set containing authentic and fallback dates
- **THEN** every row on an earlier descending page has an effective displayed date greater than or equal to every row on the following page, and rows with equal effective dates retain a stable order

### Requirement: Jobs list pagination controls

The `/jobs` page SHALL render pagination controls below the jobs table comprising: a page-size selector offering `20`, `50`, and `100` rows per page (defaulting to 20), Previous and Next navigation, and a result-range readout of the form "{from}–{to} of {total}" derived from the list response's `total`. Page size SHALL map to the `limit` URL parameter and the current page to the `offset` URL parameter, so paging state is shareable and survives reload, consistent with the page's existing URL-persisted filter and sort state. Changing the page size SHALL reset `offset` to 0. Previous SHALL be disabled on the first page and Next SHALL be disabled on the last page (`offset + limit >= total`). The controls SHALL be hidden entirely when `total` is 0.

#### Scenario: Default page size

- **WHEN** the user opens `/jobs` with no `limit` parameter and results exist
- **THEN** the page-size selector shows 20, the table renders at most 20 rows, and the range readout reads "1–20 of {total}" (or "1–{total} of {total}" when fewer than 20 results exist)

#### Scenario: Changing page size resets to the first page

- **WHEN** the user is on page 3 at 20 rows/page (`offset=40`) and selects 100 rows/page
- **THEN** the URL updates to `limit=100` with `offset` reset to 0, the table refetches the first 100 rows, and the range readout reads "1–100 of {total}"

#### Scenario: Navigating to the next page

- **WHEN** the user on page 1 at 50 rows/page (`total` is 120) clicks Next
- **THEN** the URL updates to `offset=50`, the table shows rows 51–100, the range readout reads "51–100 of 120", and Previous becomes enabled

#### Scenario: Next is disabled on the last page

- **WHEN** the visible page is the last one (`offset + limit >= total`)
- **THEN** the Next control is disabled and the range readout's upper bound equals `total`

#### Scenario: Previous is disabled on the first page

- **WHEN** the visible page is the first one (`offset = 0`)
- **THEN** the Previous control is disabled

#### Scenario: Paging state survives reload

- **WHEN** the user navigates to page 2 at 50 rows/page and reloads the browser
- **THEN** the same page (`limit=50`, `offset=50`) is fetched and rendered, and the selector still shows 50

#### Scenario: No results hides the controls

- **WHEN** the active filters match zero jobs
- **THEN** the pagination controls are not rendered and the empty state is shown instead

#### Scenario: Changing a filter returns to the first page

- **WHEN** the user is on page 4 and changes any filter
- **THEN** `offset` resets to 0 and the first page of the newly filtered result set is shown

### Requirement: Filter bar with URL-persisted state

A sticky filter bar SHALL offer: full-text search, source multi-select, minimum score slider, stage multi-select, tags combobox, remote switch, minimum salary, and a date-range picker with presets (today/3d/7d/30d/custom) bound to a `dateField` selector (posted vs first-seen). Filter state SHALL be encoded in the URL so filtered views are shareable and survive reload. Active filters SHALL render as removable chips with a "Reset" control visible only when at least one filter is active.

#### Scenario: Date-interval filtering

- **WHEN** the user picks the "7d" preset with date field "posted"
- **THEN** the jobs request includes `dateField=posted` with the matching `dateFrom`/`dateTo` ISO values and the result set updates

#### Scenario: Filters survive reload

- **WHEN** the user applies score ≥ 60 and stage "saved", then reloads the page
- **THEN** the same filters are active, shown as chips, and the same request is issued

#### Scenario: No results from filters

- **WHEN** active filters match zero jobs
- **THEN** an empty state explains that filters match nothing and offers a reset action (distinct from the "no jobs yet" empty state, which points to Sources)

### Requirement: Bulk stage actions

The user SHALL be able to select multiple rows via checkboxes; a selection summons a bottom action bar showing the count and stage actions (Mark applied, Reject, Save, Set stage…) plus a destructive Delete action. Confirming a stage action SHALL call `POST /v1/reactions/bulk` for all selected job ids and refresh the table. Confirming Delete SHALL call `POST /v1/jobs/bulk-delete` for all selected job ids, remove the deleted rows from the table, clear the selection, and close the job detail drawer if the currently-open job (if any) is among the deleted ids. Escape SHALL clear the selection. Destructive actions (Reject, Delete) SHALL require an inline arm-then-confirm control, not a native browser confirm dialog.

#### Scenario: Bulk mark applied

- **WHEN** the user selects 5 rows and clicks "Mark applied"
- **THEN** one bulk reactions request with the 5 job ids and stage `applied` is sent, the rows' stage badges update, and a polite toast confirms

#### Scenario: Bulk action failure

- **WHEN** the bulk request fails
- **THEN** the table state is not corrupted and an error toast explains the failure

#### Scenario: Bulk delete removes selected rows

- **WHEN** the user selects 3 rows, clicks "Delete", and confirms via the armed control
- **THEN** one `POST /v1/jobs/bulk-delete` request with the 3 job ids is sent, the 3 rows disappear from the table, the selection is cleared, and a success toast confirms the count deleted

#### Scenario: Bulk delete closes the open drawer

- **WHEN** the detail drawer is open for a job that is part of the current selection, and the user bulk-deletes that selection
- **THEN** the drawer closes as part of the same action, with no stale content shown afterward

#### Scenario: Bulk delete requires arming before it fires

- **WHEN** the user clicks "Delete" once with rows selected
- **THEN** no delete request is sent yet, and the control switches to a "Confirm" state; clicking it again sends the bulk-delete request

#### Scenario: Bulk delete failure

- **WHEN** the bulk-delete request fails
- **THEN** the table state is not corrupted, the selection is preserved, and an error toast explains the failure

### Requirement: Keyboard-first row flow

The table SHALL support: `j`/`k` to move row focus, `x` to toggle selection, `Enter` to open the detail drawer, `a` mark applied, `r` reject (with confirm), `/` to focus search. Shortcuts SHALL be inactive while an input or dialog has focus, and a `?` help dialog SHALL list them.

#### Scenario: Triage without mouse

- **WHEN** the user presses `j` twice, `x`, then `a`
- **THEN** focus moves down two rows, the row is selected, and an applied reaction is created for it

### Requirement: Row navigation to detail

Clicking a row SHALL open the job detail drawer (URL reflects the open job so the state survives refresh); ⌘/Ctrl-click SHALL open the full `/jobs/[id]` page.

#### Scenario: Drawer open state survives refresh

- **WHEN** the user opens a job's drawer and reloads the browser
- **THEN** the same drawer reopens over the same filtered table

### Requirement: Delete a vacancy from the jobs list

Each jobs-list row SHALL expose a keyboard-accessible destructive delete action
that identifies the vacancy by title. The action SHALL ask for confirmation
before issuing `DELETE /v1/jobs/{id}`. Canceling SHALL make no request. After a
successful deletion, the row SHALL disappear, active selection SHALL be
cleared for that id, the current filter/search URL SHALL remain intact, and a
localized success message SHALL be shown. A failed deletion SHALL leave the
table state intact and show a localized error.

#### Scenario: Confirm deletion from the list

- **WHEN** the user activates delete for a vacancy row and confirms the
  title-labelled destructive prompt
- **THEN** the client sends `DELETE /v1/jobs/{id}`, removes the row after a
  successful response, preserves the current filters, and announces success

#### Scenario: Cancel deletion from the list

- **WHEN** the user activates delete for a vacancy row and cancels the prompt
- **THEN** no delete request is sent and the row, selection, filters, and table
  state remain unchanged

#### Scenario: List deletion failure

- **WHEN** the delete request fails
- **THEN** the row remains visible, the table state is not corrupted, and an
  actionable localized error is shown

### Requirement: Jobs dashboard reconciliation strip

The Jobs dashboard header SHALL render a secondary reconciliation strip below the existing metrics row showing, across all sources: `discovered` (the cumulative `rawTotal`), `processing` (the `pending` bucket), `failed` (the `failed` bucket, rendered as a link to `/[locale]/jobs/dead-letter` when non-zero), and `hidden` (the `hiddenJobs` bucket). The strip SHALL be sourced from `GET /v1/reconciliation/jobs` and SHALL refresh independently from the jobs list query. When the reconciliation endpoint fails, the strip SHALL be omitted and the rest of the dashboard SHALL render normally. The strip SHALL be hidden entirely when `discovered` is 0 (no scraping has happened yet) to avoid cluttering a fresh-install dashboard.

#### Scenario: Reconciliation strip renders below the metrics row

- **WHEN** the user opens `/en/jobs` and `GET /v1/reconciliation/jobs` returns `rawTotal=42, pending=2, failed=3, hiddenJobs=1, visibleJobs=28, processed=33`
- **THEN** the dashboard header renders the existing four metrics followed by a secondary strip with `discovered=42, processing=2, failed=3 (as a link to /en/jobs/dead-letter), hidden=1`

#### Scenario: No scraping has happened yet

- **WHEN** the user opens `/en/jobs` and `GET /v1/reconciliation/jobs` returns every bucket as 0
- **THEN** the reconciliation strip is not rendered and the existing metrics row is the only header content

#### Scenario: Failed bucket is a deep link only when non-zero

- **WHEN** the reconciliation response has `failed=0`
- **THEN** the strip shows `failed=0` as plain text, not as a link

#### Scenario: Reconciliation endpoint failure is non-fatal

- **WHEN** `GET /v1/reconciliation/jobs` returns 502 while `GET /v1/jobs` succeeds
- **THEN** the jobs table renders normally, the existing metrics row renders normally, and the reconciliation strip is simply absent
