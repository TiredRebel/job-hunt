# PROGRESS

> Living document. Update the checkboxes and the _Log_ section as work proceeds.
> Status legend: ☐ todo · ◐ in progress · ☑ done

## Phase 0 — Bootstrap ✅

- [x] Requirements analysis, key decisions (see docs/DECISIONS.md)
- [x] Repo skeleton, git init, docs (README, ARCHITECTURE, DATA_MODEL, SOURCES, LLM_CONFIG, CODING_STANDARDS)
- [x] `.env.example`, `.gitignore`, `.editorconfig`
- [x] `infra/docker-compose.yml` draft (redis, scraper, llm; reuses existing pg + n8n)
- [x] Create `jobhunter` database in pg-learn (Postgres 17)
- [x] Turborepo + npm workspaces bootstrap (apps/web NextJS, apps/api NestJS, packages/shared-ts; services/scraper + services/llm on uv — all lint/typecheck/test gates green)
- [x] Pre-commit hooks (husky + lint-staged: prettier for TS/docs, ruff format+check per Python service)

## Phase 1 — Data model & migrations ✅

- [x] dbmate setup, migration 0001: sources, scrape_runs, jobs_raw, jobs
- [x] Migration 0002: profiles, job_matches, cover_letters
- [x] Migration 0003: llm_providers, app_settings, notifications
- [x] Migration 0004: keyword_dictionaries, job_reactions (+ job_reaction_current view, posted_at/first_seen_at indexes)
- [x] Seed: 5 sources, default profile, default Ollama provider, starter keyword dictionaries

## Phase 2 — Scraper service (Python, FastAPI) ☐

- [x] Service skeleton: clean architecture layers, ruff/mypy/pytest wired
- [x] `SourceAdapter` port + registry (config-driven enable/disable per source)
- [x] Search queries built from `keyword_dictionaries` (kind=search), re-read per run
- [x] Adapter: dou.ua (static HTML, easiest)
- [x] Adapter: work.ua
- [x] Adapter: job.ua
- [x] Adapter: Reddit (official API / JSON endpoints — no scraping needed)
- [x] Adapter: Upwork (best-effort: RSS/feeds; document anti-bot limitations)
- [ ] crawl4ai integration + agent-browser fallback strategy for JS-heavy pages
- [x] Dedup (url hash + content fingerprint), incremental scrape runs
- [x] REST: `POST /scrape/{source}`, `GET /runs`, health/metrics endpoints

## Phase 3 — LLM service (Python, FastAPI + LangGraph) ☐

- [ ] Provider abstraction (`LLMProvider` port): ollama-local, ollama-cloud, openai-compatible, anthropic
- [ ] Hot-switch: active provider read from DB, cache + `LISTEN/NOTIFY` invalidation
- [ ] LangGraph pipeline: normalize/extract (raw → structured job)
- [ ] LangGraph pipeline: summarize + tech-stack tags + red flags
- [ ] LangGraph pipeline: profile matching (0–100 score + explanation)
- [ ] LangGraph pipeline: cover-letter draft for high-score jobs
- [ ] REST: `POST /process/job`, `POST /match`, `GET/PUT /providers`, health

## Phase 4 — API gateway (NestJS) ☐

- [ ] Skeleton with clean architecture modules, ESLint/Vitest wired
- [ ] Jobs API: list/filter/search/detail, match scores (incl. **date-interval filters**: `date_field`, `date_from`, `date_to` + full-text query)
- [ ] Keyword dictionaries API: CRUD (list/create/edit/delete items, enable/disable)
- [ ] Reactions API: add reaction (single + **bulk for selected vacancies**), timeline per job, filter jobs by current stage
- [ ] Profile API: CRUD for CV/skills/preferences
- [ ] LLM admin API: list providers, switch active, test connection
- [ ] Sources/runs API: trigger scrape, run history
- [ ] OpenAPI spec + generated TS client in `packages/shared-ts`

## Phase 5 — Web app (NextJS) ◐

- [x] UI design spec (docs/UI_DESIGN.md): tokens, dark/light theming, dense table + stage kanban, EN+UA i18n, a11y gates
- [ ] Skeleton (App Router, Tailwind, shadcn/ui), Playwright wired
- [ ] Jobs dashboard: list, filters (source, score, tags, salary, remote, **date range picker**, reaction stage), detail view
- [ ] Keyword dictionaries editor (search terms, stop-words, must/nice-to-have, aliases)
- [ ] Reaction tracking: stage badge + timeline on job detail; multi-select rows → bulk "applied/rejected/..." action
- [ ] Profile editor (skills, seniority, salary expectations, stop-words)
- [ ] LLM settings page: provider list, on-the-fly switch, connection test
- [ ] Sources page: enable/disable, schedules, run history
- [ ] Cover-letter view/edit for matched jobs

## Phase 6 — n8n workflows ☐

- [ ] Workflow: scheduled scrape trigger per source (cron → scraper API)
- [ ] Workflow: post-processing chain (scrape done → llm process → match)
- [ ] Workflow: Telegram notification for new jobs above score threshold
- [ ] Workflow: daily email digest
- [ ] Export all workflows to `n8n/workflows/*.json` (versioned)

## Phase 7 — Hardening ☐

- [ ] Coverage gates (TS + Python), e2e happy path
- [ ] Structured logging + correlation ids across services
- [ ] Rate limiting / politeness per source (robots, delays, jitter)
- [ ] Error budget: retries, dead-letter handling for failed scrapes
- [ ] CI pipeline (lint, typecheck, test, build)

---

## Log

| Date       | Entry                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-15 | Project bootstrapped: decisions taken (hybrid n8n+LangGraph, mixed Py/TS stack, full LLM scope, TG+email+dashboard notifications). Docs and skeleton composed.                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-07-15 | Requirements added: date-interval filter/search, editable keyword dictionaries, per-vacancy reaction tracking (event-log model, bulk actions). DATA_MODEL/PROGRESS/README updated.                                                                                                                                                                                                                                                                                                                                                           |
| 2026-07-15 | UI design spec composed (docs/UI_DESIGN.md) via design-taste-frontend skill. Decisions: dark+light theme toggle (dark-first, hunter-green accent), Tailwind + shadcn/ui, dense TanStack table + dnd-kit stage kanban, EN+UA i18n (next-intl), motion budget + WCAG AA gates.                                                                                                                                                                                                                                                                 |
| 2026-07-15 | Coding standards tightened: Python — uv, ruff (PEP 8 + pydocstyle D/Google), full typings + mypy --strict package-wide, itertools/functools preference, mandatory docstrings; TS — strict mode extended (exactOptionalPropertyTypes, noImplicitOverride), TSDoc required on all exports + module headers, enforced via eslint-plugin-jsdoc.                                                                                                                                                                                                  |
| 2026-07-15 | Phase 0 complete: monorepo bootstrapped — apps/web (NextJS 15, Tailwind), apps/api (NestJS 11 + Vitest, health endpoint), packages/shared-ts, services/scraper + services/llm (FastAPI, uv, ruff/mypy --strict/pytest all green), turborepo pipelines, husky + lint-staged pre-commit, `jobhunter` DB created in pg-learn.                                                                                                                                                                                                                   |
| 2026-07-15 | Phase 1 complete: dbmate wired up (migrations 0001–0004 applied — sources, scrape_runs, jobs_raw, jobs, profiles, job_matches, cover_letters, llm_providers, app_settings, notifications, keyword_dictionaries, job_reactions + job_reaction_current view, indexes); seed applied (5 sources, default profile, Ollama provider, starter keyword dictionaries); schema.sql dumped; db:\* npm scripts added.                                                                                                                                   |
| 2026-07-15 | Phase 2 scraper service built: PoliteClient (robots.txt, per-host throttle+jitter, anti-bot detection → FetchBlockedError), 5 adapters (dou.ua, work.ua, job.ua, Reddit JSON API, Upwork RSS best-effort with graceful block degradation), content-fingerprint dedup + per-run seen-set, run orchestration with partial/failed statuses, REST `POST /scrape/{source}` (202 + background run) and `GET /runs`. 25 tests green on fixtures (no network), ruff + mypy --strict clean. Open: crawl4ai/agent-browser fallback for JS-heavy pages. |
