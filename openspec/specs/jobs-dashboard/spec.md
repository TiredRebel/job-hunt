# jobs-dashboard

## Purpose

The `/jobs` page: a filterable, sortable, keyboard-first jobs table with URL-persisted filter state, bulk stage actions, and navigation into job detail.

## Requirements

### Requirement: Filterable jobs table

The `/jobs` page SHALL render vacancies in a dense table (TanStack Table) with columns: selection checkbox, score, title+company, source, salary, tags (≤3 visible + "+N"), posted date, stage. Score, posted and salary columns SHALL be sortable; a column-visibility menu SHALL allow hiding columns. Filtering, sorting and pagination SHALL be server-driven via `GET /v1/jobs` query parameters. The table SHALL virtualize rows above 200 items while preserving table semantics (`aria-sort`, announced row selection).

#### Scenario: Default listing

- **WHEN** the user opens `/jobs` with no filters
- **THEN** the first page of jobs renders server-side with score badges tinted by the semantic score scale and monospace tabular numerals for scores, salaries and dates

#### Scenario: Sorting by score

- **WHEN** the user clicks the score column header
- **THEN** the table refetches with the corresponding sort parameter and the header exposes `aria-sort`

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

The user SHALL be able to select multiple rows via checkboxes; a selection summons a bottom action bar showing the count and stage actions (Mark applied, Reject, Save, Set stage…). Confirming an action SHALL call `POST /v1/reactions/bulk` for all selected job ids and refresh the table. Escape SHALL clear the selection. Destructive actions (Reject) SHALL require an inline confirm.

#### Scenario: Bulk mark applied

- **WHEN** the user selects 5 rows and clicks "Mark applied"
- **THEN** one bulk reactions request with the 5 job ids and stage `applied` is sent, the rows' stage badges update, and a polite toast confirms

#### Scenario: Bulk action failure

- **WHEN** the bulk request fails
- **THEN** the table state is not corrupted and an error toast explains the failure

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
