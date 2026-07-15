# PROGRESS

> Living document. Update the checkboxes and the *Log* section as work proceeds.
> Status legend: ☐ todo · ◐ in progress · ☑ done

## Phase 0 — Bootstrap ◐
- [x] Requirements analysis, key decisions (see docs/DECISIONS.md)
- [x] Repo skeleton, git init, docs (README, ARCHITECTURE, DATA_MODEL, SOURCES, LLM_CONFIG, CODING_STANDARDS)
- [x] `.env.example`, `.gitignore`, `.editorconfig`
- [x] `infra/docker-compose.yml` draft (redis, scraper, llm; reuses existing pg + n8n)
- [ ] Create `jobhunter` database in pg-learn (Postgres 17)
- [ ] Turborepo + npm workspaces bootstrap
- [ ] Pre-commit hooks (husky, lint-staged, pre-commit for Python)

## Phase 1 — Data model & migrations ☐
- [ ] dbmate setup, migration 0001: sources, scrape_runs, jobs_raw, jobs
- [ ] Migration 0002: profiles, job_matches, cover_letters
- [ ] Migration 0003: llm_providers, app_settings, notifications
- [ ] Seed: 5 sources, default profile, default Ollama provider

## Phase 2 — Scraper service (Python, FastAPI) ☐
- [ ] Service skeleton: clean architecture layers, ruff/mypy/pytest wired
- [ ] `SourceAdapter` port + registry (config-driven enable/disable per source)
- [ ] Adapter: dou.ua (static HTML, easiest)
- [ ] Adapter: work.ua
- [ ] Adapter: job.ua
- [ ] Adapter: Reddit (official API / JSON endpoints — no scraping needed)
- [ ] Adapter: Upwork (best-effort: RSS/feeds; document anti-bot limitations)
- [ ] crawl4ai integration + agent-browser fallback strategy for JS-heavy pages
- [ ] Dedup (url hash + content fingerprint), incremental scrape runs
- [ ] REST: `POST /scrape/{source}`, `GET /runs`, health/metrics endpoints

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
- [ ] Jobs API: list/filter/search/detail, match scores
- [ ] Profile API: CRUD for CV/skills/preferences
- [ ] LLM admin API: list providers, switch active, test connection
- [ ] Sources/runs API: trigger scrape, run history
- [ ] OpenAPI spec + generated TS client in `packages/shared-ts`

## Phase 5 — Web app (NextJS) ☐
- [ ] Skeleton (App Router, Tailwind, shadcn/ui), Playwright wired
- [ ] Jobs dashboard: list, filters (source, score, tags, salary, remote), detail view
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

| Date | Entry |
|---|---|
| 2026-07-15 | Project bootstrapped: decisions taken (hybrid n8n+LangGraph, mixed Py/TS stack, full LLM scope, TG+email+dashboard notifications). Docs and skeleton composed. |
