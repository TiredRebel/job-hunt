---
updated: 2026-07-16
sources: [../../PROGRESS.md]
---

<!-- checkpoint: Phase 4 tests + OpenAPI client done (commits 4db1252, eee7b50) -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-15)

- **Phase 0 — Bootstrap: ✅ complete.** Monorepo up: apps/web (NextJS 15,
  Tailwind), apps/api (NestJS 11, health endpoint, Vitest), packages/shared-ts,
  services/scraper + services/llm (FastAPI, uv, ruff+mypy+pytest strict),
  turborepo pipelines, husky + lint-staged pre-commit. `jobhunter` database
  created in `pg-learn` (Postgres 17 @5432).
- **Phase 1 — Data model & migrations: ✅ complete.** dbmate migrations
  `0001`–`0004` applied (core/scraper/llm schemas: sources, scrape_runs,
  jobs_raw, jobs, profiles, job_matches, cover_letters, llm_providers,
  app_settings, notifications, keyword_dictionaries, job_reactions +
  job_reaction_current view); seed applied (5 sources, default profile,
  Ollama provider, starter keyword dictionaries); `db:*` npm scripts.
- **Phase 2 — Scraper service: ✅ complete except one item.** In
  `services/scraper`: `PoliteClient` (robots.txt, per-host throttle + jitter,
  anti-bot detection → `FetchBlockedError`, **no CAPTCHA/bot evasion** per
  ADR-006); 5 adapters (dou.ua, work.ua, job.ua, Reddit JSON API, Upwork RSS
  best-effort with graceful block degradation); content-fingerprint dedup +
  DB unique constraint (`source_id, external_id, content_hash`); run
  orchestration with success/partial/failed statuses; REST
  `POST /scrape/{source}` (202 + background run), `GET /runs`, `/health`.
  25 pytest tests on recorded fixtures (no network); ruff + mypy --strict
  clean. **Open:** crawl4ai integration + agent-browser fallback for
  JS-heavy pages (checkbox left unticked in PROGRESS Phase 2).
- **Phase 3 — LLM service: ✅ complete.** `services/llm` has provider hub
  (`LLMProvider` port: ollama-local, ollama-cloud, openai-compatible, anthropic),
  DB-driven hot-switch with cache + `LISTEN/NOTIFY` invalidation, LangGraph
  pipelines (normalize/extract, summarize+tags+red-flags, profile match 0–100,
  cover-letter draft), REST `POST /process/job`, `POST /match`,
  `GET/PUT /providers/active`, `/health`. Routes extracted into
  `llm.routes` APIRouter; `llm.main` keeps app-factory/lifespan wiring.
  27 pytest tests green; ruff + mypy --strict clean. **Open:** re-run these
  checks to confirm (session classifier blocked automated shell execution).
- **Phase 4 — API gateway: ◐ in progress (tests + generated client done).**
  `apps/api` bootstrapped with Clean Architecture modules (config, logger, DB,
  ports, Postgres repositories, HTTP clients). Bounded contexts: jobs,
  keyword-dictionaries, reactions, profiles, llm-admin, sources. Endpoints:
  `GET/PUT /jobs/:id/status`, `GET/POST/PATCH/DELETE /keyword-dictionaries`,
  `POST /reactions` + `POST /reactions/bulk` + `GET /reactions/:jobId/timeline`,
  `GET/POST/PATCH/DELETE /profiles`, `GET/PUT/POST /llm/providers`,
  `GET/PATCH/POST /sources/:slug(/scrape|/runs)`. Date-interval filters
  (`date_field`, `date_from`, `date_to`) and full-text query wired.
  **40 unit tests** green across all six modules (in-memory repository fakes,
  commit `4db1252`). **OpenAPI TS client generated** in `packages/shared-ts`:
  `apps/api/scripts/emit-openapi.ts` dumps `openapi.json` without booting HTTP,
  `openapi-typescript` emits `src/generated/api.ts`, re-exported as
  `ApiPaths`/`ApiOperations`; package has its own eslint flat config
  (generated file excluded) — typecheck/lint/build green (commit `eee7b50`).
  **Open:** enrich OpenAPI schemas with `@ApiProperty` / response DTOs so the
  generated types carry response shapes, not just paths.
- **All design docs composed** (2026-07-15): ARCHITECTURE, DECISIONS (7 ADRs),
  DATA_MODEL, SOURCES, LLM_CONFIG, CODING_STANDARDS, UI_DESIGN; PROGRESS
  tracking live; coding standards tightened (mypy --strict; TS strict extras
  incl. exactOptionalPropertyTypes, noImplicitOverride; TSDoc on exports).
- **Repo state:** git repo at E:\job-hunter; latest commit `eee7b50`
  (shared-ts OpenAPI client). Prior: `4db1252` (Phase 4 modules + 40 unit
  tests), `63b8a59` (LLM routes refactor), `e9ea0af` (Phase 3 complete),
  `6b24cdc` (Phase 2 scraper), `bfbf97e` (Phase 1 migrations). Untracked
  local-only dirs left out of commits: `.claude/`, `openspec/`.
- **Code knowledge graph** (Graphify → `../../graphify-out/`) is **stale**
  (built at Phase 1, commit badce609) — run `graphify update .` to refresh.

## Next up — finish Phase 4

1. **Enrich OpenAPI schemas**: `@ApiProperty` on DTOs + typed response DTOs
   (`@ApiOkResponse` etc.) so the generated client carries real shapes;
   regenerate `packages/shared-ts` afterwards (`npm run generate`).
2. Re-check PROGRESS.md Phase 4 checklist for any remaining gateway items.

Done this session: 40 unit tests (`4db1252`), LLM quality gates re-confirmed
green (28/28 pytest, ruff, mypy --strict), OpenAPI TS client (`eee7b50`).

See `../../PROGRESS.md` for full Phase 4 checklist.

## In-flight / open threads

- Phase 4 API gateway: OpenAPI schema enrichment remaining.
- Phase 2 leftover: crawl4ai + agent-browser fallback for JS-heavy sources.
- Graphify graph stale; refresh after next code milestone.
- Shell classifier intermittently blocking automated Bash/PowerShell execution;
  use `! <command>` in terminal for `npx`/`uv run` commands when needed.

## Resume commands

```powershell
cd E:\job-hunter
npm install                          # if node_modules missing
cd apps\api; npm run lint; npm run typecheck; npm run test
cd ..\..\services\scraper; uv run pytest -q; uv run mypy .; uv run ruff check .
cd ..\llm; uv run pytest -q; uv run mypy .; uv run ruff check .
cat ..\..\PROGRESS.md                # canonical checklist
qmd search "<topic>"                 # search this wiki
```
