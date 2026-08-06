# sources-admin

## Purpose

The `/sources` page: administer scraping sources — enable/disable, trigger manual scrapes, and inspect run history.

## Requirements

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

### Requirement: Create a source

The `/sources` page SHALL offer "Add source" buttons above and below the sources list, both opening a create form with fields: slug (required, `^[a-z0-9-]+$`), name (required), base URL (required, valid URL), fetch strategy (required, one of `api` / `crawl4ai` / `agent-browser`), config (JSON object, default `{}`), and enabled (default on). Submitting SHALL call `POST /v1/sources`, which inserts into `core.sources` and returns the created source; the list SHALL refresh and a success toast SHALL confirm. A duplicate slug SHALL return 409 and surface as an inline error on the slug field; validation failures SHALL return 400 and surface without closing the form. When the entered slug has no registered scraper adapter, the form SHALL show a non-blocking warning that the source cannot be scraped until an adapter exists.

#### Scenario: Adding a valid source

- **WHEN** the user opens the create form from either "Add source" button, fills valid values with slug `djinni`, and submits
- **THEN** `POST /v1/sources` persists the row, the dialog closes, a success toast appears, and `djinni` renders in the list (with a "no adapter" indicator, since no adapter is registered for it)

#### Scenario: Duplicate slug is rejected

- **WHEN** the user submits the create form with slug `dou`, which already exists
- **THEN** the API responds 409, the dialog stays open, and an inline error on the slug field explains the slug is taken

### Requirement: Edit a source

Each source row SHALL offer an "Edit" action opening the create form pre-filled in edit mode, with the slug shown but immutable. Submitting SHALL call `PATCH /v1/sources/{slug}` with name, base URL, fetch strategy, config, and enabled; the updated source SHALL be reflected in the list on success. Config SHALL be edited as JSON text with client-side validation (invalid JSON disables submit); the server SHALL reject a config that is not a JSON object with 400.

#### Scenario: Editing a source's base URL

- **WHEN** the user opens Edit on `workua`, changes the base URL, and submits
- **THEN** `PATCH /v1/sources/workua` persists the change, the dialog closes, and the row reflects the server response

#### Scenario: Invalid config JSON blocks submit

- **WHEN** the user types malformed JSON into the config field
- **THEN** an inline error marks the field and the submit button is disabled until the JSON parses

### Requirement: Delete a source

Each source row SHALL offer a "Delete" action calling `DELETE /v1/sources/{slug}`. Activating it SHALL ask for confirmation naming the source before any request is made. Confirmed deletion SHALL permanently remove the source row and respond with a `deleted: true` result. An unknown slug SHALL respond 404. Deletion SHALL be rejected with 409 while the source has any associated `core.jobs`, `scraper.jobs_raw`, or `scraper.scrape_runs` rows, and the response SHALL explain that the source must be emptied of that data or left disabled instead — no dependent job or scrape-run data SHALL be deleted or reassigned as a side effect. A successful deletion SHALL refresh the sources list and show a confirmation toast; a rejected deletion SHALL leave the source and its data unchanged and show an error toast with the server's explanation.

#### Scenario: Deleting an unused source

- **WHEN** the user clicks Delete on a source that has never been scraped (no jobs, raw jobs, or scrape runs) and confirms
- **THEN** the API responds with `deleted: true`, the row disappears from the list, and a success toast appears

#### Scenario: Cancelling at the confirmation

- **WHEN** the user clicks Delete but dismisses the confirmation
- **THEN** no request is made and the source remains unchanged

#### Scenario: Source with data is protected

- **WHEN** the user clicks Delete on a source that has associated jobs or scrape runs and confirms
- **THEN** `DELETE /v1/sources/{slug}` responds 409 without removing the source or any of its data, and the row shows an error toast explaining the source must be emptied or disabled instead

#### Scenario: Unknown slug

- **WHEN** a `DELETE /v1/sources/{slug}` request arrives for a slug that does not exist
- **THEN** the response is 404

### Requirement: Test source connectivity

Each source row SHALL offer a "Test" action calling `POST /v1/sources/{slug}/test`, which the gateway proxies to the scraper's `POST /sources/{slug}/test`. The test SHALL be synchronous and side-effect-free (no scrape run row, no raw job writes) and SHALL exercise the real fetch path: adapter registry lookup, fetch-strategy fetcher resolution, and one polite fetch of the adapter's probe URL through the shared politeness gate. The result SHALL be one of `ok` (with HTTP status and elapsed ms), `no_adapter`, `unsupported_strategy`, `blocked`, or `failed` (each with a human-readable detail), rendered inline on the row — not only as a toast — persisting until the next test or reload. While a test is in flight the row's Test action SHALL be disabled. A failing test outcome SHALL still be an HTTP 200 from the gateway; 502 SHALL be reserved for the scraper service itself being unreachable.

#### Scenario: Testing a healthy source

- **WHEN** the user clicks Test on `dou` and the listing page responds normally
- **THEN** the row shows an `ok` result with the HTTP status and elapsed milliseconds

#### Scenario: Testing a source without an adapter

- **WHEN** the user clicks Test on a source whose slug has no registered adapter
- **THEN** the row shows a `no_adapter` result explaining an adapter must be implemented before scraping

#### Scenario: Testing a blocked source

- **WHEN** the user clicks Test on `upwork` and the fetch is refused by robots.txt or an anti-bot interstitial is detected
- **THEN** the row shows a `blocked` result with the block reason, and no browser escalation is attempted

### Requirement: Adapter registry visibility

The scraper service SHALL expose its registered adapter slugs via `GET /adapters`, and the gateway SHALL proxy them at `GET /v1/sources/adapters` (registered so it is not captured by the `GET /v1/sources/{slug}` route). The `/sources` page SHALL fetch this list separately from the sources list and SHALL mark any source whose slug is absent with a visible "no adapter" indicator. When the adapter list cannot be fetched (scraper down), the page SHALL degrade gracefully: sources still render, indicators are simply omitted.

#### Scenario: Source without adapter is marked

- **WHEN** the sources list contains slug `djinni` and the adapter list does not
- **THEN** the `djinni` row renders a "no adapter" indicator

#### Scenario: Scraper unavailable degrades gracefully

- **WHEN** `GET /v1/sources/adapters` fails
- **THEN** the sources list still renders normally, without adapter indicators and without an error state
