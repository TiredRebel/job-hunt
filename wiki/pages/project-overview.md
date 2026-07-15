---
updated: 2026-07-15
sources: [../../README.md, ../../docs/ARCHITECTURE.md, ../../PROGRESS.md]
---

# Project overview — job-hunter

Personal job-search automation platform: scrapes UA job boards + Upwork +
Reddit, runs LLM pipelines (normalize → summarize/tag → match vs. profile →
cover-letter draft), and surfaces everything in a dashboard with Telegram/email
notifications.

## Monorepo layout (turborepo + npm workspaces)

- `apps/web` — NextJS 15 dashboard (TS, Tailwind; design spec in `docs/UI_DESIGN.md`)
- `apps/api` — NestJS 11 API gateway (OpenAPI contract, health endpoint, Vitest)
- `packages/shared-ts` — shared TS types/contracts
- `services/scraper` — Python FastAPI (uv, ruff, mypy --strict, pytest)
- `services/llm` — Python FastAPI + LangGraph provider hub & pipelines
- `n8n/` — exported workflow JSONs (triggers/notifications only, no business logic)
- `infra/` — docker-compose (Redis, service wiring)
- `docs/` — canonical design docs (see [index](../index.md) raw-sources table)

## External systems (pre-existing on this machine)

- Postgres 17 container `pg-learn` @ localhost:5432 → database `jobhunter`
- n8n container @ :5678 · Redis @ :6379 (queue via arq)

## Working conventions

- Clean Architecture per service; contract-first APIs; no cross-schema DB access.
- Strict tooling both languages — see `docs/CODING_STANDARDS.md`.
- No CAPTCHA bypassing / bot-detection evasion; Upwork is best-effort (ADR-006).

Related: [architecture](architecture.md) · [decisions](decisions.md) · [current-state](current-state.md)
