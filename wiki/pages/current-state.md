---
updated: 2026-07-15
sources: [../../PROGRESS.md]
---

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
- **All design docs composed** (2026-07-15): ARCHITECTURE, DECISIONS (7 ADRs),
  DATA_MODEL, SOURCES, LLM_CONFIG, CODING_STANDARDS, UI_DESIGN; PROGRESS
  tracking live; coding standards tightened (mypy --strict; TS strict extras
  incl. exactOptionalPropertyTypes, noImplicitOverride; TSDoc on exports).
- **Repo state:** git repo at E:\job-hunter; latest commits: `6b24cdc`
  (Phase 2 scraper), `bfbf97e` (Phase 1 migrations). (Note: some sessions
  may not detect the repo from a different cwd.)
- **Code knowledge graph** (Graphify → `../../graphify-out/`) is **stale**
  (built at Phase 1, commit badce609) — run `graphify update .` to refresh.

## Next up — Phase 3: LLM service (FastAPI + LangGraph)

Per `PROGRESS.md`: `LLMProvider` port (ollama-local, ollama-cloud,
openai-compatible, anthropic), DB-driven hot-switch with LISTEN/NOTIFY cache
invalidation, LangGraph pipelines (normalize/extract → summarize/tags →
profile match 0–100 → cover letter), REST `POST /process/job`, `POST /match`,
`GET/PUT /providers`. See `docs/LLM_CONFIG.md`. Deferred from Phase 2:
crawl4ai/agent-browser fallback strategy.

## In-flight / open threads

- Phase 2 leftover: crawl4ai + agent-browser fallback for JS-heavy sources.
- Graphify graph stale; refresh after next code milestone.

## Resume commands

```powershell
cd E:\job-hunter
npm install                          # if node_modules missing
npx turbo run lint typecheck test    # verify TS toolchain green
cd services\scraper; uv run pytest -q; uv run mypy .; uv run ruff check .
cat PROGRESS.md                      # canonical checklist
qmd search "<topic>"                 # search this wiki
```
