## MODIFIED Requirements

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
