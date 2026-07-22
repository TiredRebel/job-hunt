## ADDED Requirements

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
