## 1. Extract shared packages (monolith still builds)

- [x] 1.1 Create `packages/web-ui` workspace package (`@job-hunter/web-ui`) and move UI primitives from `apps/web/src/components/ui/**` plus `cn`/utils from `apps/web/src/lib/utils.ts`; verify package exports resolve and `npm run typecheck` succeeds in `packages/web-ui` (or root Turbo filter).
- [x] 1.2 Create `packages/web-api` workspace package (`@job-hunter/web-api`) and move `apps/web/src/lib/api/**` (client, query-keys, domain modules + `*.spec.ts`); verify package unit tests pass and exports include query keys + API modules.
- [x] 1.3 Point `apps/web` imports at `@job-hunter/web-ui` and `@job-hunter/web-api`; remove duplicate source-of-truth copies (temporary re-exports only if needed and documented); verify `apps/web` `typecheck`, `lint`, and `test` still pass.
- [x] 1.4 Wire new packages into root Turbo/`package.json` workspaces as needed; verify `turbo run typecheck --filter=web...` (or equivalent) includes the new packages without errors.

## 2. Scaffold shell + remotes + Turbo multi-zones

- [x] 2.1 Scaffold `apps/web-shell`, `apps/web-jobs`, `apps/web-board`, and `apps/web-settings` as Next 16 / React 19 apps depending on `@job-hunter/web-ui`, `@job-hunter/web-api`, and `@job-hunter/shared-ts`; verify each app starts independently on documented ports (shell 3000, jobs 3001, board 3002, settings 3003 unless occupied).
- [x] 2.2 Configure multi-zones path rewrites/proxies on `apps/web-shell` and `basePath`/`assetPrefix` on remotes so locale-prefixed `/jobs`, `/board`, and settings paths reach remote stubs; verify with HTTP requests through the shell origin that each remote stub responds (no Module Federation, no iframes).
- [x] 2.3 Add Turbo/`package.json` scripts to run shell+remotes in parallel for local dev; verify `turbo run typecheck` (or package scripts) covers all four new apps.
- [x] 2.4 Add a short README per new app documenting port, basePath, and rewrite ownership; verify docs match the running config. Keep `apps/web` intact (do not delete yet).

## 3. Migrate jobs + board remotes

- [x] 3.1 Move jobs App Router pages and `components/jobs/**` (plus dead-letter) into `apps/web-jobs` using shared packages; verify jobs unit tests pass in the jobs app and `/[locale]/jobs` through the shell renders the real UI (not a stub).
- [x] 3.2 Move board pages and `components/board/**` into `apps/web-board`; verify board unit tests pass and `/[locale]/board` through the shell renders the real UI.
- [x] 3.3 Move or update Playwright jobs/board e2e to target the shell origin; verify jobs and board e2e smoke paths pass against the composed shell.
- [x] 3.4 Remove migrated jobs/board implementations from `apps/web` (or redirect so they do not double-render); verify monolith no longer owns primary jobs/board feature source and shell composition still works.

## 4. Migrate settings, cutover, docs/wiki, verify

- [x] 4.1 Move settings-domain pages/components (`sources`, `dictionaries`, `profile`, `settings/llm`) into `apps/web-settings`; verify those locale-prefixed routes through the shell render real UIs and related unit tests pass.
- [x] 4.2 Ask once, then remove `apps/web` or reduce it to a documented redirect shim to `apps/web-shell`; update root Turbo/CI workspace references; verify shell is the documented primary entry and all three remotes compose.
- [x] 4.3 Update `docs/ARCHITECTURE.md` web service row for shell+remotes+ports; update `wiki/pages/architecture.md` and `wiki/pages/current-state.md`; append `wiki/log.md`; run `graphify update .`; verify docs describe multi-zones composition and forbid Module Federation/iframes.
- [x] 4.4 Run lint, typecheck, unit tests for shell, remotes, and shared packages; run Playwright e2e for jobs, board, and at least one settings smoke path via shell origin; verify all OpenSpec gates for this change are green and mark remaining tasks complete.
