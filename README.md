# Job Hunter

Modular, microservices-based web application for online job search: monitors **work.ua, job.ua, dou.ua, Upwork, Reddit**, normalizes and scores postings with LLMs, and presents everything in a NextJS dashboard with Telegram/e-mail notifications.

**Key features**

- Date-interval filter/search over jobs (`posted_at` / `first_seen_at`), combined with source, tags, score, salary, remote, full-text query
- **Editable keyword dictionaries** (search terms, stop-words, must/nice-to-have, aliases) that drive scraper queries and match filtering — no redeploys
- **Reaction tracking** per vacancy: application lifecycle (saved → applied → replied → interview → offer/rejected) as an append-only timeline, with bulk actions on selected vacancies
- LLM pipelines: normalize/extract, summarize + tag + red-flags, profile matching (0–100), cover-letter drafts
- Hot-switchable LLM provider (local Ollama, Ollama Cloud, any OpenAI-compatible, Anthropic)

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
```

- **Polyglot by design**: Python where the ecosystem is strongest (crawl4ai, LangGraph, LLM tooling), TypeScript for web/API.
- **Hybrid orchestration**: n8n owns _scheduling and notifications_; LangGraph owns _in-code agentic pipelines_ (normalize → tag → match → cover letter).
- **Hot-switchable LLM**: active provider/model lives in the DB (`llm_providers`), switchable from the dashboard without restarts. Supports local Ollama, Ollama Cloud, OpenAI-compatible endpoints, Anthropic, etc.

Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DATA_MODEL.md](docs/DATA_MODEL.md) · [docs/SOURCES.md](docs/SOURCES.md) · [docs/LLM_CONFIG.md](docs/LLM_CONFIG.md) · [docs/DECISIONS.md](docs/DECISIONS.md) · [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Repository layout (monorepo)

```
job-hunter/
├─ apps/
│  ├─ web/            # NextJS 15 (App Router) — dashboard, admin, LLM switcher
│  └─ api/            # NestJS API gateway — REST, auth, aggregation
├─ services/
│  ├─ scraper/        # Python FastAPI — source adapters (crawl4ai / agent-browser / APIs)
│  └─ llm/            # Python FastAPI — LangGraph pipelines + provider abstraction
├─ packages/
│  └─ shared-ts/      # shared TS types, API client (generated from OpenAPI)
├─ n8n/workflows/     # exported n8n workflow JSON (versioned)
├─ infra/
│  ├─ docker-compose.yml
│  └─ db/migrations/  # plain SQL migrations (dbmate)
└─ docs/              # architecture, ADRs, data model, standards
```

## Prerequisites

| Dependency        | Status on this machine                     |
| ----------------- | ------------------------------------------ |
| Node.js ≥ 22      | ✅ v24.18.0                                |
| Python ≥ 3.12     | required for `services/*`                  |
| Docker            | ✅ 29.6.1                                  |
| PostgreSQL 17     | ✅ container `pg-learn` @ `localhost:5432` |
| n8n               | ✅ container @ `localhost:5678`            |
| agent-browser CLI | ✅ 0.31.2                                  |

## Quick start

```bash
cp .env.example .env                                # fill in secrets
docker compose -f infra/docker-compose.yml up -d redis
npm install && npm run dev                          # web + api (turborepo)
cd services/llm && uv sync && uv run uvicorn llm.main:app --port 8002 --reload
cd services/scraper && uv sync && uv run uvicorn scraper.main:app --port 8001 --reload
```

- Web dashboard: http://localhost:3000
- API gateway: http://localhost:4000/v1 (Swagger UI at `/api`)
- n8n: http://localhost:5678

Full install/config/deploy steps, including database setup, per-service env
files, LLM provider setup, and n8n import: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Quality bar

- **Clean Architecture** in every service: `domain / application / infrastructure / presentation` layers, dependencies point inward.
- **TS**: strict mode, ESLint (flat config) + Prettier, Vitest unit tests, Playwright e2e.
- **Python**: ruff (lint+format), mypy strict, pytest + pytest-asyncio, ≥80% coverage on domain/application layers.
- **Contracts**: OpenAPI schemas per service; TS client generated, never hand-written.
- Conventional Commits; pre-commit hooks (husky + lint-staged / pre-commit).

See [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md).

## Status

Work is tracked in [PROGRESS.md](PROGRESS.md).
