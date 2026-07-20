## Context

`core.jobs` is the normalized vacancy record used by both `/jobs` and
`/board`. The gateway already supports status changes (`new`, `processed`,
`archived`, and `hidden`) but has no deletion operation. Derived records already
reference `core.jobs` with cascade behavior for matches, cover letters,
reactions, and board positions; notification rows use `SET NULL` where
appropriate. The web app has separate list and board mutations, so deletion
must be one shared API operation followed by view-specific cache updates.

## Goals / Non-Goals

**Goals:**

- Provide an explicit, irreversible delete operation for a normalized vacancy.
- Remove the vacancy consistently from the jobs list and board.
- Delete user-visible derived records atomically through existing foreign-key
  cascades.
- Preserve raw scrape provenance for audit/deduplication and avoid deleting
  scrape-run history.
- Require a clear, title-labelled confirmation in both UI entry points.
- Keep OpenAPI, the generated client, localization, and regression coverage in
  sync.

**Non-Goals:**

- Replace archive/hidden status workflows.
- Add an undo or recycle-bin feature.
- Delete source configuration, scrape runs, or raw scrape provenance.
- Add bulk deletion or automatic retention policies.
- Add authentication/authorization changes beyond the existing single-user
  gateway behavior.

## Decisions

### Use a dedicated `DELETE /v1/jobs/:id` operation

Add `delete(id)` to the job repository port, expose it through `JobsService`,
and add `DELETE /jobs/:id` to `JobsController`. Return the existing typed
`DeletedResponse` shape with `{ deleted: true }`; return 404 when the job does
not exist. This follows the established provider, profile, and dictionary
deletion conventions and keeps status changes semantically separate.

**Alternative considered:** Treat “delete” as `PATCH status=hidden`. Rejected:
hidden is an existing reversible workflow and would leave the vacancy and its
derived records in the database, contrary to an explicit delete request.

### Rely on existing foreign-key cascades inside the repository transaction

Execute the delete through the existing PostgreSQL transaction helper. The
database cascades matches, cover letters, reactions, and board positions;
notification references are nulled where defined. Retain `scraper.jobs_raw`
and scrape-run history because `core.jobs.raw_id` is nullable and raw records
are ingestion provenance rather than user-visible vacancy state. Add a schema
migration only if verification finds a missing cascade or constraint.

**Alternative considered:** Manually delete every dependent table in
application code. Rejected: it duplicates database ownership rules and creates
more opportunities for partial cleanup.

### Use the existing browser-confirmation convention

The jobs-list row action and board-card action call a confirmation that includes
the vacancy title before issuing the request. Cancellation performs no network
request and leaves selection, board order, and filters unchanged. This matches
the existing destructive reaction flow without introducing a one-off dialog
abstraction.

### Invalidate shared job and board queries after success

After a successful delete, clear affected selection state and invalidate the
jobs and board query keys. Do not optimistically remove the record before the
server confirms deletion because the operation is irreversible. A failed or
404 response leaves the current view intact and shows the localized error.

## Risks / Trade-offs

- **[Irreversible data loss]** → Require title-labelled confirmation, make the
  action visibly destructive, and state in the confirmation that reactions,
  matches, cover letters, and board placement will be removed.
- **[Vacancy reappears after a later scrape]** → Retain raw provenance and
  document that deletion applies to the normalized vacancy; a future changed
  source record may legitimately be ingested as a new vacancy.
- **[Stale list and board views]** → Invalidate both query families after the
  API succeeds and cover list/board success plus failure in Playwright tests.
- **[Foreign-key assumptions drift]** → Add repository integration/schema
  verification for dependent-row cleanup and fail the change if a required
  cascade is absent.

## Migration Plan

1. Verify current foreign-key behavior against the migration/schema files and
   add a narrowly scoped migration only if required.
2. Implement and test the gateway endpoint, regenerate OpenAPI and the shared
   client, then implement the two web entry points and localized confirmation.
3. Run API, shared-client, web, and focused Playwright gates.
4. Roll back application commits if needed; no data rollback is possible after
   a confirmed deletion, so production rollout must follow the existing backup
   and migration practices.

## Open Questions

- Should a future source scrape that produces the same external vacancy be
  allowed to create it again, or should a persistent tombstone be introduced?
- Should delete be exposed from the job detail drawer in a follow-up change,
  or remain limited to the jobs list and board as requested?
