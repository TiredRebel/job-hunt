# sources-admin

## ADDED Requirements

### Requirement: Sources list with enable toggle

The `/sources` page SHALL list all sources from `GET /v1/sources` with: name/slug, an enable/disable switch calling `PATCH /v1/sources/{slug}/enabled`, the schedule (cron expression with a human-readable hint), and the last run's status and time.

#### Scenario: Disabling a source

- **WHEN** the user switches a source off
- **THEN** the enabled state is persisted via the API and the switch reflects the server response (reverting with an error toast on failure)

### Requirement: Manual scrape trigger

Each source row SHALL offer a "Run now" action calling `POST /v1/sources/{slug}/scrape`. While a run is being triggered the action SHALL be disabled; the outcome (accepted/failed) SHALL surface as a toast and the run history SHALL refresh.

#### Scenario: Triggering a scrape

- **WHEN** the user clicks "Run now" on dou.ua
- **THEN** the scrape request is sent, a toast confirms the run was accepted, and the new run appears in the history once listed by the API

### Requirement: Run history

The page SHALL show run history per source from `GET /v1/sources/{slug}/runs`: started time, duration, status (success/partial/failed with warning tint for stale/failed), and item counts (found/new).

#### Scenario: Inspecting recent runs

- **WHEN** the user expands a source's run history
- **THEN** recent runs render newest-first with locale-formatted timestamps and monospace numerals
