## Why

Vacancies that are irrelevant, duplicated, or no longer useful can currently
only be hidden or archived. They remain in the underlying job dataset and can
continue to appear in board-oriented workflows, making cleanup harder during
daily triage. A confirmed delete action from both primary vacancy views gives
the user one consistent way to remove a vacancy and its user-visible derived
records.

## What Changes

- Add a versioned `DELETE /v1/jobs/:id` endpoint with a typed deletion result
  and not-found handling.
- Permanently remove the normalized vacancy and its dependent matches,
  cover-letter records, reaction events, and manual board-position records in
  one database transaction; retain raw scrape provenance unless the design
  phase establishes a stronger ownership rule.
- Add a clearly destructive, title-labelled confirmation action to each jobs
  list row without disrupting row navigation, selection, sorting, or filters.
- Add the same delete action to each board card, removing the card from the
  current column after a successful request.
- Update client cache/state and URL state so a deleted selected/open vacancy
  cannot remain visible in either view; show success and failure feedback.
- Add API, repository, client, jobs-list, and board regression tests, including
  cascade behavior and confirmation cancellation.
- Regenerate the OpenAPI document and shared TypeScript client.

## Capabilities

### New Capabilities

- `job-deletion`: Permanently delete a vacancy and its user-visible derived
  records through a confirmed API operation.

### Modified Capabilities

- `jobs-dashboard`: Add a confirmed delete action to the vacancy list while
  preserving existing table interactions and filtering behavior.
- `stage-board`: Add a confirmed delete action to board cards and remove the
  deleted vacancy from the board state.

## Impact

- Database: deletion transaction and existing foreign-key cascade behavior for
  `core.job_matches`, `core.cover_letters`, `core.job_reactions`, and
  `core.job_board_position`; raw scrape retention must be documented and
  verified.
- API gateway: jobs repository port/adapter, jobs service/controller,
  response DTOs, OpenAPI output, and service/repository tests.
- Web app: shared jobs API client, job-table row actions, stage-card actions,
  cache invalidation/optimistic state, localized destructive confirmation and
  toast messages, plus unit and Playwright coverage.
- Shared contracts: regenerated `packages/shared-ts` client.
- No new dependency or external service is required.
