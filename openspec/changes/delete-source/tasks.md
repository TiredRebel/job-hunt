## 1. Contract preparation

- [ ] 1.1 Verify there is no existing index on `scraper.scrape_runs.source_id`; if the guard query in task 2.2 shows a sequential scan on a non-trivial table, add a narrowly scoped migration (`CREATE INDEX`) — otherwise skip it.
- [ ] 1.2 Confirm `DeletedResponse` in `apps/api/src/common/common.response.dto.ts` is reusable as-is for `SourcesService.delete()`.

## 2. Gateway source deletion

- [ ] 2.1 Extend `apps/api/src/application/ports/source-repository.port.ts` with `delete(slug: string): Promise<'deleted' | 'not_found' | 'in_use'>`.
- [ ] 2.2 Implement `PostgresSourceRepository.delete()` in `apps/api/src/infrastructure/repositories/postgres-source.repository.ts`: single guarded `DELETE FROM core.sources WHERE slug = $1 AND NOT EXISTS(...) AND NOT EXISTS(...) AND NOT EXISTS(...) RETURNING id` (design.md D2); on 0 rows, follow up with `findBySlug` to distinguish `'not_found'` from `'in_use'`.
- [ ] 2.3 Add `SourcesService.delete(slug)`: `'deleted'` → `{ deleted: true }`, `'not_found'` → `NotFoundException`, `'in_use'` → `ConflictException` naming the slug (design.md D3).
- [ ] 2.4 Add `DELETE /v1/sources/:slug` to `apps/api/src/sources/sources.controller.ts` with typed Swagger responses (`DeletedResponse`, 404, 409).
- [ ] 2.5 Add `SourcesService` unit tests: successful delete, unknown slug, in-use slug.

## 3. OpenAPI and shared client

- [ ] 3.1 Regenerate the gateway OpenAPI document; verify `DELETE /v1/sources/{slug}` and its response/error schemas are present.
- [ ] 3.2 Regenerate `packages/shared-ts/src/generated/api.ts`; run its typecheck, lint, and build gates.
- [ ] 3.3 Add `deleteSource(slug)` to `apps/web/src/lib/api/sources.ts` using the generated operation types.

## 4. Sources list deletion UX

- [ ] 4.1 Add a keyboard-accessible destructive "Delete" icon action to `SourceRow` in `apps/web/src/components/sources/sources-page.tsx`, next to the existing Edit/Test actions (design.md D4).
- [ ] 4.2 Wire the delete mutation: `window.confirm` naming the source before calling `deleteSource`; on success invalidate `queryKeys.sources.all` and `queryKeys.reconciliation.sources` and show a success toast; on error (404/409) show an error toast with the server's message.
- [ ] 4.3 Add EN/UA translations in `apps/web/messages/{en,uk}.json` under `sources`: delete label, confirm copy, success, and error strings.
- [ ] 4.4 Add a component test in `apps/web/src/components/sources/sources-page.spec.tsx` covering: confirm → success removes the row, cancel → no request, 409 error → row and data unchanged with an error toast shown.

## 5. Final verification and documentation

- [ ] 5.1 Run API tests, lint, typecheck, build; run shared-client gates; run web tests, lint, typecheck, build.
- [ ] 5.2 Manually verify against the running stack: deleting a source with zero jobs/runs succeeds; deleting a source with existing jobs or runs returns 409 and leaves it intact.
- [ ] 5.3 Run `openspec validate delete-source --strict` and verify every task and scenario is satisfied.
- [ ] 5.4 Update `PROGRESS.md` and `docs/DATA_MODEL.md`/API docs with the new endpoint and the "must be empty to delete" semantics.
