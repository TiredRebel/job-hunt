# Job Hunter

Personal job-search automation platform: monitors Ukrainian and remote boards
(**work.ua**, **job.ua**, **dou.ua**, **Upwork**, **Reddit**), normalizes and
scores postings with LLMs, and surfaces everything in a dense Next.js dashboard
with Telegram and e-mail notifications.

Built as a polyglot monorepo — Python where the scraping/LLM ecosystems are
strongest, TypeScript for the web UI and API gateway — with Clean Architecture
in every service and hot-switchable LLM providers (local Ollama, Ollama Cloud,
OpenAI-compatible endpoints, Anthropic).

## What it does

1. **Scrape** — n8n (or the Sources page) triggers adapters; fetch ladder is
   API/RSS → crawl4ai (static HTML) → agent-browser (JS-heavy). Results are
   deduped and stored with scrape provenance.
2. **Process** — a Redis-backed LangGraph pipeline normalizes each posting,
   summarizes + tags + flags risks, matches against your active profile
   (0–100 score), and optionally drafts a cover letter for high scores.
3. **Triage** — filter, score, and react to vacancies in the dashboard; track
   application stages on a kanban board; get Telegram pushes and a daily e-mail
   digest via n8n.

## Features

### Dashboard (Next.js)

| Area                               | What you get                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Jobs** (`/jobs`)                 | Dense filterable table: source, tags, score, salary, remote, full-text, date range (`posted_at` / `first_seen_at`), reaction stage; detail drawer; permanent delete with confirmation |
| **Board** (`/board`)               | Kanban for application lifecycle: saved → applied → interview → offer / rejected (drag-and-drop + keyboard)                                                                           |
| **Sources** (`/sources`)           | Enable/disable sources, trigger scrapes, run history, reconciliation when counts drift                                                                                                |
| **Dictionaries** (`/dictionaries`) | Editable keyword sets (search terms, stop-words, must/nice-to-have, aliases) that drive scraper queries — no redeploy                                                                 |
| **Profile** (`/profile`)           | Skills, seniority, salary expectations, preferences used by the matcher                                                                                                               |
| **LLM settings** (`/settings/llm`) | Add/test providers, pick models, hot-switch the active provider, per-pipeline overrides                                                                                               |

Also: EN + UA i18n, dark/light + design-mode themes, keyboard shortcuts for
triage, bulk reaction and bulk-delete actions, dead-letter / reconciliation
views when scrape intake fails.

### Scraping & LLM

- Source adapters behind a shared `SourceAdapter` port; DOU / Work.ua / Job.ua
  share a static-HTML lifecycle; Reddit uses the public JSON API; Upwork is
  **best-effort** (no CAPTCHA bypass or login automation — see
  [docs/SOURCES.md](docs/SOURCES.md)).
- LangGraph pipelines: normalize/extract → summarize + tags + red flags →
  profile match → cover-letter draft (threshold-gated).
- Provider hub reads `llm_providers` from Postgres; switch from the dashboard
  without restarting workers (`LISTEN/NOTIFY` + short TTL cache).

### Notifications

- n8n owns schedules, Telegram bot delivery, and the daily e-mail digest.
- Workflows are versioned under `n8n/workflows/` and call HTTP endpoints only —
  no business logic in n8n.

## Architecture at a glance

```
                 ┌─────────────────────────────────────────────────┐
                 │                  n8n  (:5678)                   │
                 │  schedules scrapes · Telegram bot · email digest │
                 └───────┬─────────────────────────────▲───────────┘
                         │ HTTP triggers               │ webhooks
                         ▼                             │
┌──────────────┐   ┌──────────────┐   ┌──────────────┐│┌──────────────┐
│  web (Next)  │──▶│ api gateway  │──▶│   scraper    │││  llm service │
│  TS  :3000   │   │ NestJS :4000 │   │ FastAPI :8001│││ FastAPI :8002│
│  dashboard   │   │ REST + auth  │   │ crawl4ai +   │││ LangGraph    │
│  LLM switch  │   │ aggregation  │   │ agent-browser│││ provider hub │
└──────────────┘   └──────┬───────┘   └──────┬───────┘│└──────┬───────┘
                          │                  │        │       │
                          ▼                  ▼        │       ▼
                 ┌─────────────────────────────────────────────────┐
                 │        PostgreSQL 17  (localhost:5432)          │
                 │   jobs · matches · profiles · llm_providers     │
                 └─────────────────────────────────────────────────┘
                          ▲
                          │ Redis (:6379) — scrape→LLM work queue (arq)
```

**Design principles**

- **Polyglot by design**: Python for crawl4ai / LangGraph / LLM tooling;
  TypeScript for web and the NestJS gateway.
- **Hybrid orchestration**: n8n for scheduling and notifications; LangGraph for
  in-code agentic pipelines.
- **Schema-per-concern**: services talk over HTTP or Redis, never by reading
  another service’s tables (`scraper.*`, `llm.*`, `core.*`).
- **Hot-switchable LLM**: active provider/model lives in the DB and is
  switchable from the dashboard.

Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
[docs/DATA_MODEL.md](docs/DATA_MODEL.md) · [docs/SOURCES.md](docs/SOURCES.md) ·
[docs/LLM_CONFIG.md](docs/LLM_CONFIG.md) · [docs/DECISIONS.md](docs/DECISIONS.md) ·
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · [docs/UI_DESIGN.md](docs/UI_DESIGN.md)

## Screenshots

Product screenshots are not checked into this repository yet. The dashboard UI
is specified in [docs/UI_DESIGN.md](docs/UI_DESIGN.md) (hunter-green accent,
dense table + stage kanban, EN/UA). If you capture local screenshots later,
a conventional place is `docs/images/` with relative links from this section.

## Repository layout (monorepo)

```
job-hunter/
├─ apps/
│  ├─ web/            # Next.js 15 (App Router) — dashboard, admin, LLM switcher
│  └─ api/            # NestJS API gateway — REST, aggregation, OpenAPI
├─ services/
│  ├─ scraper/        # Python FastAPI — source adapters (crawl4ai / agent-browser / APIs)
│  └─ llm/            # Python FastAPI — LangGraph pipelines + provider abstraction
├─ packages/
│  └─ shared-ts/      # shared TS types, API client (generated from OpenAPI)
├─ n8n/workflows/     # exported n8n workflow JSON (versioned)
├─ infra/
│  ├─ docker-compose.yml
│  └─ db/migrations/  # plain SQL migrations (dbmate)
├─ docs/              # architecture, ADRs, data model, standards
└─ wiki/              # LLM-maintained session-context wiki (optional for humans)
```

## Prerequisites

| Dependency        | Notes                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| Node.js ≥ 22      | Turborepo workspaces (`apps/*`, `packages/*`)                                   |
| Python ≥ 3.12     | `services/scraper` and `services/llm` via [uv](https://github.com/astral-sh/uv) |
| Docker            | Redis (required); optional full Compose stack                                   |
| PostgreSQL 17     | Database `jobhunter` (local container or Compose)                               |
| n8n               | Schedules + Telegram/e-mail (existing container or Compose)                     |
| agent-browser CLI | Optional fallback for JS-heavy pages                                            |

## Quick start

```bash
cp .env.example .env                                # fill in secrets
docker compose -f infra/docker-compose.yml up -d redis
npm install && npm run db:up                        # migrate schema (dbmate)
npm run dev                                         # web + api (turborepo)
cd services/llm && uv sync && uv run uvicorn llm.main:app --port 8002 --reload
cd services/scraper && uv sync && uv run uvicorn scraper.main:app --port 8001 --reload
```

| Surface       | URL                                          |
| ------------- | -------------------------------------------- |
| Web dashboard | http://localhost:3000                        |
| API gateway   | http://localhost:4000/v1 (Swagger at `/api`) |
| n8n           | http://localhost:5678                        |
| Scraper       | http://localhost:8001                        |
| LLM service   | http://localhost:8002                        |

Full install, database, per-service env files, LLM provider setup, and n8n
import: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

### Typical usage after boot

1. Open **LLM settings** and confirm an active provider (e.g. local Ollama).
2. Edit **Dictionaries** and **Profile** so scrapes and matching match your search.
3. On **Sources**, enable boards and trigger a scrape (or let n8n cron do it).
4. Triage on **Jobs** / **Board**; high-score matches can notify via Telegram.

## Quality bar

- **Clean Architecture** in every service: `domain / application / infrastructure / presentation`, dependencies point inward.
- **TS**: strict mode, ESLint (flat config) + Prettier, Vitest unit tests, Playwright e2e.
- **Python**: ruff (lint+format), mypy strict, pytest + pytest-asyncio, coverage gated on domain/application layers.
- **Contracts**: OpenAPI schemas per service; TS client generated, never hand-written.
- Conventional Commits; pre-commit hooks (husky + lint-staged / pre-commit).

See [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md).

## Status

Phases 0–7 (bootstrap through hardening) are complete. Day-to-day work and the
dated log live in [PROGRESS.md](PROGRESS.md). Session restore context for agents
is in [wiki/pages/current-state.md](wiki/pages/current-state.md).
