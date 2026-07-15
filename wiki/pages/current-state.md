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
- **All design docs composed** (2026-07-15): ARCHITECTURE, DECISIONS (7 ADRs),
  DATA_MODEL, SOURCES, LLM_CONFIG, CODING_STANDARDS, UI_DESIGN; PROGRESS
  tracking live; coding standards tightened (mypy --strict; TS strict extras
  incl. exactOptionalPropertyTypes, noImplicitOverride; TSDoc on exports).
- **Repo state:** git initialized inside E:\job-hunter with docs/bootstrap
  commits (note: some sessions may not detect it from a different cwd).
- **This wiki** bootstrapped as the session-context layer; qmd search
  configured over it.
- **Code knowledge graph** built via Graphify → `../../graphify-out/`
  (graph.html, GRAPH_REPORT.md, graph.json; 372 nodes / 41 communities);
  stale after code changes until `graphify update .` is re-run.

## Next up — Phase 1: Data model & migrations

Per `PROGRESS.md`: dbmate migrations `0001`–`0004` creating schemas
`core` / `scraper` / `llm` (profiles, sources, jobs_raw, jobs, job_matches,
cover_letters, llm_providers, app_settings, keyword dictionaries …) per
`docs/DATA_MODEL.md`. Then Phase 2 (scraper service), Phase 3 (llm service),
Phase 4 (api), Phase 5 (web), Phase 6 (n8n workflows), Phase 7 (hardening),
plus coverage gates (TS + Python) and e2e happy path.

## In-flight / open threads

- None blocking. Wiki just created — future sessions: run **checkpoint** after
  each milestone so this page never goes stale.

## Resume commands

```powershell
cd E:\job-hunter
npm install            # if node_modules missing
npx turbo run lint typecheck test   # verify toolchain green
cat PROGRESS.md        # canonical checklist
qmd search "<topic>"   # search this wiki
graphify explain "<Node>"  # navigate code structure from the graph
```
