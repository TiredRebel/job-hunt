---
updated: 2026-07-23
sources:
  [
    ../../PROGRESS.md,
    ../../openspec/changes/archive/2026-07-23-jobs-bulk-delete/tasks.md,
    ../../openspec/changes/archive/2026-07-22-sources-jobs-count-discrepancy/tasks.md,
    ../../openspec/changes/archive/2026-07-22-fix-board-cross-column-keyboard-drag/tasks.md,
    ../../openspec/changes/archive/2026-07-23-improve-board-dnd-perf/tasks.md,
    ../../docs/ARCHITECTURE.md,
    ../../docs/DEPLOYMENT.md,
  ]
---

<!-- checkpoint: All phases 0-7 complete; 12 OpenSpec changes archived (last: jobs-bulk-delete on 2026-07-23, da64a5b). Working tree has only graphify-out regen noise. Next phase open. -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-23)

**Phases 0–7 are complete and committed on `origin/master`.** The repo's
current branch is `fix-jobs_count` (12+ commits ahead of local `master`,
identical to `origin/master` — local `master` is simply stale and unmoved
since the work switched to the feature branch). The working tree is clean
of application code: the only uncommitted modifications are regenerated
`graphify-out/*` metadata and a `wiki/CLAUDE.md` graphify-section edit,
both pre-existing tooling artifacts, not application changes.

### What shipped since the last wiki checkpoint (2026-07-21 → 2026-07-23)

The 2026-07-21 checkpoint described `sources-jobs-count-discrepancy` as
"implemented + live-verified, not yet committed." It has since shipped,
along with seven more OpenSpec changes. Highlights of the 2026-07-21→23
window (full per-commit detail in `PROGRESS.md`'s dated log and each
change's `tasks.md`):

- **`e2d8550` feat(jobs): add reconciliation dashboard, list pagination,
  adapter cleanup** — the `sources-jobs-count-discrepancy` work plus
  `jobs-list-pagination` plus adapter simplification, all in one commit.
- **`6f91998` fix(jobs): close detail view promptly after delete; add
  bulk delete** — the `jobs-bulk-delete` OpenSpec change: new
  `POST /v1/jobs/bulk-delete` endpoint, bulk action bar Delete control
  (arm-then-confirm), and the drawer-close-timing fix (reordered
  `onSuccess` so the close/toast fire synchronously and the list
  invalidation is fire-and-forget).
- **Board keyboard-drag + DnD perf fixes** (`0de7015` → `e56bcdc`,
  OpenSpec `fix-board-cross-column-keyboard-drag` and
  `improve-board-dnd-perf`): cross-column keyboard drag now lands on the
  target column; self-collision excluded from collision detection;
  pointer-first collision detection with bounded drag re-renders.
- **CI repair run** (`263e805`, `69b1c05`, `a7dbda2`, `b8120a4`): e2e
  fixture seeding repaired, web coverage gate closed, Playwright traces
  uploaded from the actual output directory, first-interaction retry on
  freshly-loaded pages.
- **Earlier same-day fixes** (pre-window, committed before
  `e2d8550`): n8n intake-processing activation, sources run-status/
  counter refresh, LLM fenced-structured-response acceptance, n8n cloud
  LLM throttling, encrypted direct provider keys, draft provider
  connection testing, model validation in connection test, and a cluster
  of web UI fixes (material textarea/select radius, drawer close
  scrollbar offset, score/drawer-close separation, job action layout
  overflow) plus the autoresearch-driven jobs-route performance work
  (lazy-load job detail drawer, split jobs table hydration).

### OpenSpec archive status (2026-07-23)

Twelve OpenSpec changes are now archived under
`openspec/changes/archive/`:

1. `2026-07-16-phase-2-crawl4ai-fetch-ladder`
2. `2026-07-16-phase-5-web-dashboard`
3. `2026-07-16-phase-6-n8n-workflows`
4. `2026-07-17-sources-page-crud`
5. `2026-07-18-llm-settings-config`
6. `2026-07-18-llm-provider-delete-and-model-picker`
7. `2026-07-19-phase-7-hardening`
8. `2026-07-20-delete-job`
9. `2026-07-20-notification-settings-and-board-reorder`
10. `2026-07-22-simplify-static-html-adapters`
11. `2026-07-22-jobs-list-pagination`
12. `2026-07-22-sources-jobs-count-discrepancy`
13. `2026-07-22-fix-board-cross-column-keyboard-drag`
14. `2026-07-23-improve-board-dnd-perf`
15. `2026-07-23-jobs-bulk-delete` ⭐ (archived this session, `da64a5b`)

No active (non-archived) changes remain under `openspec/changes/`.
Main specs at `openspec/specs/` (24 capabilities, `openspec validate
--all --strict` → 24/24 green).

### Wiki drift correction (2026-07-23)

The 2026-07-21 checkpoint was badly stale: it described
`sources-jobs-count-discrepancy` as the in-flight work and listed "commit

- archive" as the next step. In fact that change shipped as part of
  `e2d8550`, seven more changes followed, and all 15 archive moves (not
  12 — three more were found in the archive dir beyond what the old
  checkpoint counted) were already done before this session. This
  checkpoint replaces it. Lesson: the wiki must be reconciled against
  `git log --oneline` and `openspec/changes/archive/` on restore, not
  trusted as a sole source of truth.

## Next up

**No defined next step.** All seven phases are complete and committed,
all OpenSpec changes archived, specs synced, gates green. The project
is at a natural decision point — the user picks the next work item.
Candidate threads the prior checkpoint called out, carried forward
where still relevant:

- **agent-browser's CLI contract is unverified** — before relying on
  `agent-browser`-strategy scraping for real, install it locally
  (`npm i -g agent-browser && agent-browser install`), run
  `agent-browser skills get core --full`, and adjust
  `SCRAPER_AGENT_BROWSER_CMD` / the output-parsing logic in
  `agent_browser.py` if the real contract differs from the `read [url]`
  guess.
- **Live end-to-end smoke of the n8n workflows is still an operator
  step**: no Telegram bot / SMTP credentials exist yet. See
  `n8n/README.md` "Verifying end to end".
- Redis/arq queue handoff between scraper and llm (ARCHITECTURE.md
  mentions it) was explicitly **not** built — the processing chain polls
  the gateway instead; revisit if scale demands it.
- Component-rendering coverage remains sparse: Sources, Dictionaries,
  Profile, and LLM Settings still only have `lib/api/*` client-layer
  tests. This is why Phase 7's web coverage gate remains scoped to
  `src/lib/**`.

## In-flight / open threads

None beyond the carry-forward items above. The git working tree is
clean of application code; only `graphify-out/*` regen noise and a
`wiki/CLAUDE.md` graphify-section edit remain uncommitted (both
tooling artifacts, not application work — same pattern seen across
prior commits this session, intentionally not staged).

## Resume commands

```powershell
cd E:\job-hunter
git log --oneline -20                    # reconcile wiki vs. git on restore
openspec list --json                    # active changes (should be empty)
openspec validate --all --strict        # 24/24

npm install
cd services\llm; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd services\scraper; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd apps\api; npm run typecheck; npm run lint; npm run test; npm run build; cd ..\..
cd packages\shared-ts; npm run typecheck; npm run lint; npm run build; cd ..\..
cd apps\web
npm run typecheck; npm run lint; npm run test; npm run build
# e2e (optional — needs API on :4000 + seed):
npm run test:e2e:install
npm run test:e2e
cd ..\..
cat PROGRESS.md

# Or bring up the full stack via Docker (see docs/DEPLOYMENT.md):
docker compose -f infra/docker-compose.yml --profile services up -d --build
```
