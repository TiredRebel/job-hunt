# scrape-scheduling

## Purpose

n8n scheduler workflow that triggers scraper runs on a base cron cadence, honoring per-source cadence hints and enabled/disabled status, with failure isolation between sources.

## Requirements

### Requirement: Cron-driven scrape triggering

An n8n scheduler workflow SHALL run on a base cron cadence (default hourly),
fetch the source list from the gateway (`GET /v1/sources`), and trigger
`POST /scrape/{slug}` on the scraper service for every enabled source that is
due. Disabled sources SHALL never be triggered.

#### Scenario: Enabled sources are triggered on schedule

- **WHEN** the scheduler fires and `dou` and `workua` are enabled
- **THEN** the workflow POSTs `/scrape/dou` and `/scrape/workua` on the
  scraper service and each returns 202

#### Scenario: Disabled source is skipped

- **WHEN** the scheduler fires and `upwork` is disabled
- **THEN** no scrape request is sent for `upwork`

### Requirement: Per-source cadence hint

When a source's `config.cron` (or `config.schedule`) declares a cadence, the
scheduler SHALL only trigger that source when it is due relative to its last
run; sources without a cadence hint SHALL be triggered on every base tick.

#### Scenario: Source with a 4-hour cadence

- **WHEN** the hourly scheduler fires and `reddit` has `config.cron` equal to
  every 4 hours with a last run 2 hours ago
- **THEN** `reddit` is not triggered on this tick

### Requirement: Scheduler failure handling

A failed scrape trigger (non-2xx, timeout) SHALL NOT abort the remaining
sources in the same tick, and the workflow execution SHALL record the failure
so it is visible in n8n's execution list.

#### Scenario: One source down, others proceed

- **WHEN** the scraper returns 409 for `jobua` (disabled race) while other
  sources are healthy
- **THEN** the remaining sources are still triggered and the execution log
  marks the `jobua` step as failed
