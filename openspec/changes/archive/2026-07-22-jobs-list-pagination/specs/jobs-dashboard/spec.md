## ADDED Requirements

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
