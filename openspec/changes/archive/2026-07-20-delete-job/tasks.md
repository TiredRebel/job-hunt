## 1. Data ownership and contract preparation

- [x] 1.1 Verify the current foreign keys and delete behavior for `core.job_matches`, `core.cover_letters`, `core.job_reactions`, `core.job_board_position`, notification references, and `scraper.jobs_raw`; confirm raw provenance remains retained.
- [x] 1.2 Add a narrowly scoped migration only if a required dependent cascade or constraint is missing, then update `infra/db/schema.sql` through the repository's normal migration/dump flow. Existing constraints already satisfy the required semantics, so no migration or schema dump change is needed.
- [x] 1.3 Add or reuse the typed `DeletedResponse` contract so a successful job deletion returns `{ deleted: true }` consistently with existing deletion endpoints. Reused `common.response.dto.ts`.

## 2. Gateway job deletion

- [x] 2.1 Extend `apps/api/src/application/ports/job-repository.port.ts` with a deletion method returning whether the normalized job existed.
- [x] 2.2 Implement transactional deletion in `apps/api/src/infrastructure/repositories/postgres-job.repository.ts`, deleting only the normalized job row and relying on verified foreign-key cascades for dependent user-visible records.
- [x] 2.3 Add `JobsService.delete()` with not-found handling consistent with existing job detail/status methods.
- [x] 2.4 Add `DELETE /v1/jobs/:id` to `apps/api/src/jobs/jobs.controller.ts` with typed Swagger responses and bigint-as-string parameter handling.
- [x] 2.5 Add gateway service tests for successful deletion, missing jobs, and failure propagation; repository/integration coverage is not present in the existing API test infrastructure, so FK/schema verification covers dependent cleanup and raw provenance.

## 3. OpenAPI and shared client

- [x] 3.1 Emit the updated gateway OpenAPI document and verify the `DELETE /v1/jobs/{id}` operation and response schema are present.
- [x] 3.2 Regenerate `packages/shared-ts/src/generated/api.ts` and run its typecheck, lint, and build gates.
- [x] 3.3 Add `deleteJob(id)` to `apps/web/src/lib/api/jobs.ts` using the generated operation types and add request/error tests.

## 4. Jobs-list deletion UX

- [x] 4.1 Add a keyboard-accessible destructive row action in the jobs table that names the vacancy title in the existing confirmation convention and does not interfere with row navigation or checkbox selection.
- [x] 4.2 Add the delete mutation to the jobs client, invalidate the jobs query after success, clear the deleted row from selection/focus state, preserve the current URL filters, and show localized success/error feedback.
- [x] 4.3 Add EN/UA translations for delete labels, confirmation copy, success, failure, and not-found/error states without rendering secret or raw backend details.
- [x] 4.4 Add API-client request/error coverage and focused Playwright coverage for cancellation, success, failure, and state preservation.

## 5. Board deletion UX

- [x] 5.1 Add a keyboard-accessible destructive delete action to board cards that names the vacancy title and preserves existing drag/sort controls.
- [x] 5.2 Add board delete handling that calls the shared jobs delete endpoint, removes the card only after success, preserves remaining card order, invalidates affected board/jobs queries, and leaves the board unchanged on failure.
- [x] 5.3 Add Playwright coverage for confirmed list deletion, confirmed board deletion, cancellation in both views, and failure-state preservation; verify the deleted vacancy is absent after reload.

## 6. Final verification and documentation

- [x] 6.1 Run API tests, lint, typecheck, and build; run shared-client gates; run web tests, lint, typecheck, build, and focused Playwright regressions.
- [x] 6.2 Run `openspec validate delete-job --strict` and verify every task and scenario is satisfied.
- [x] 6.3 Update `PROGRESS.md` and relevant data-model/API documentation with the deletion semantics, retained raw provenance, and irreversible-action warning.
