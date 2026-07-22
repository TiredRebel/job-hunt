## MODIFIED Requirements

### Requirement: Sources list with enable toggle

The `/sources` page SHALL list all sources from `GET /v1/sources` with: name/slug, an enable/disable switch calling `PATCH /v1/sources/{slug}/enabled`, the schedule (cron expression with a human-readable hint), the last run's status and time, per-row Edit and Test actions, — when the adapter registry is available — a "no adapter" indicator on sources whose slug has no registered scraper adapter, AND a per-source jobs-health summary line showing the buckets `raw / processed / pending / failed / hidden` computed from `GET /v1/reconciliation/sources`. The summary SHALL be labeled as cumulative across all runs (distinct from the per-run counters in the run-history table) via a localized label. When the reconciliation endpoint fails, the page SHALL degrade gracefully: sources still render, the summary line is omitted, and no error state is shown for the whole list.

#### Scenario: Disabling a source

- **WHEN** the user switches a source off
- **THEN** the enabled state is persisted via the API and the switch reflects the server response (reverting with an error toast on failure)

#### Scenario: Row actions are present

- **WHEN** the sources list renders
- **THEN** every row exposes Edit and Test actions alongside the existing enable switch, "Run now" button, and the jobs-health summary line

#### Scenario: Reconciliation endpoint unavailable degrades gracefully

- **WHEN** `GET /v1/reconciliation/sources` fails while `GET /v1/sources` succeeds
- **THEN** the sources list still renders normally with all existing controls and badges; the jobs-health summary line is simply absent on every row

#### Scenario: Jobs-health summary distinguishes cumulative from per-run

- **WHEN** a source's last run shows `found=10, new=3` and its cumulative summary shows `raw=42, processed=28, pending=2, failed=1, hidden=2`
- **THEN** both are visible on the row at the same time, the per-run counters in the run-history table are unchanged, and the cumulative summary is labeled with a localized "across all runs" hint
