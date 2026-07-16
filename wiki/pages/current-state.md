---
updated: 2026-07-16
sources: [../../PROGRESS.md, ../../openspec/changes/phase-6-n8n-workflows/tasks.md]
---

<!-- checkpoint: Phase 6 n8n workflows complete (26/26), not yet archived -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-16)

- **Phases 0–5:** complete (see prior checkpoints / `PROGRESS.md`). Phase 5's
  OpenSpec change is archived at
  `openspec/changes/archive/2026-07-16-phase-5-web-dashboard/`.
- **Phase 6 — n8n workflows: ✅ complete, not yet archived.** OpenSpec change
  `phase-6-n8n-workflows` (26/26 tasks) still lives at
  `openspec/changes/phase-6-n8n-workflows/`; archiving is a next-up item.
  - **Gateway `automation` module** (`apps/api/src/automation/`):
    `GET /v1/automation/jobs/unprocessed`, `POST /v1/automation/jobs/{id}
/results` (transactional upsert into `core.jobs`/`job_matches`
    /`cover_letters`, never overwrites an edited cover letter), `GET
/v1/automation/matches/unnotified`, `POST /v1/automation/notifications`
    (409 on duplicate), `GET/POST /v1/automation/digest[/sent]`. Guarded by
    `InternalTokenGuard` (reuses existing `INTERNAL_API_TOKEN`
    /`X-Internal-Token`, not a new secret).
  - **Scraper additions** (schema-ownership rule — gateway never queries
    `scraper.*` directly): `GET /jobs_raw/unprocessed`, `POST /jobs_raw/{id}
/mark` (attempt counter, gives up after `max_process_attempts`); new
    `jobs_raw.title` column (was discarded at fetch time, now threaded
    through `insert_raw`).
  - **Fixed a pre-existing bug**: `POST /scrape/{slug}` never returned
    `runId` (created inside the backgrounded coroutine, after the response
    was sent) — silently broken since Phase 4 for both the Phase 5 web
    "trigger scrape" button and the new scheduler workflow. Fixed by
    creating the run row synchronously in the handler.
  - **Cover-letter regeneration** closes the Phase 5 deferral: LLM
    `POST /cover-letter`, gateway `POST /v1/jobs/:id/cover-letter/regenerate`
    (404 no job/no persisted match, 503 no provider, 502 other LLM failure),
    web "Regenerate" button live (loading state, no-match tooltip,
    confirm-before-discard on unsaved edits).
  - **Four n8n workflows** (`scrape-scheduler`, `processing-chain`,
    `telegram-notifications`, `email-digest`) hand-authored — no interactive
    n8n session was available — then **schema-validated for real** via
    `n8n import:workflow` against the user's running n8n 2.18.7 instance
    (imported inactive, ids `jh-*`, no credentials attached). Exported to
    `n8n/workflows/*.json` + `n8n/README.md` (import steps, required env
    vars, credentials, cadences, re-export rule).
  - Migrations 0006 (`jobs_raw.processed_at`/`process_attempts`,
    `app_settings.last_digest_at`) and 0007 (`jobs_raw.title`); seed gained
    per-source cadence hints (`config.cron`).
- **Gates:** llm 30/30 pytest + ruff + mypy --strict; scraper 30/30 + ruff +
  mypy --strict; api 80/80 vitest + tsc + eslint + build; shared-ts build;
  web 37/37 vitest + tsc + eslint + `next build`. All green.

## Next up

- Archive OpenSpec change `phase-6-n8n-workflows`.
- Phase 2 leftover: crawl4ai + agent-browser for JS-heavy sources.
- Phase 7 — hardening (coverage gates, structured logging/correlation ids,
  CI pipeline).
- Refresh Graphify graph (`graphify update .`) — stale again after this
  much new code.

## In-flight / open threads

- **Live end-to-end smoke of the n8n workflows is still an operator step**:
  no Telegram bot / SMTP credentials exist yet, and a local attempt to run
  `services/scraper` natively hit a pre-existing, unrelated Windows/psycopg
  issue (`ProactorEventLoop` incompatible with async psycopg — likely fine
  under the project's normal WSL/Docker dev workflow). See
  `n8n/README.md` "Verifying end to end".
- Redis/arq queue handoff between scraper and llm (ARCHITECTURE.md mentions
  it) was explicitly **not** built for Phase 6 — the processing chain polls
  the gateway instead; revisit under Phase 7 if scale demands it.
- Dictionary enable is **per-dictionary** (API has no per-item enabled flag).
- Sources schedule: cron read from `config.cron` (seeded hourly for
  dou/workua/jobua, every-4-hours for reddit/upwork); the scrape-scheduler
  workflow implements the 4-hourly check as plain hour-modulo arithmetic
  (no cron-parser dependency in n8n).
- LLM connection test API targets **active** provider only; non-active cards
  disable Test.
- Playwright e2e needs live API + seeded jobs for full happy path.
- `core.jobs.remote`/`seniority` are closed enums but the LLM's `normalize`
  output is a boolean/free-text guess — the automation repository and the
  cover-letter regenerate path both map defensively (`hybrid` is never
  produced from the boolean, unknown seniority strings fall back to
  `'unknown'`).

## Resume commands

```powershell
cd E:\job-hunter
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
```
