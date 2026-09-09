---
updated: 2026-09-09
sources: [../../docs/ARCHITECTURE.md]
---

# Architecture digest

Full detail: `docs/ARCHITECTURE.md`. This page is the fast-restore digest.

## Services

| Service                            | Stack                       | Port                          |
| ---------------------------------- | --------------------------- | ----------------------------- |
| apps/web-shell                     | NextJS 16, TS               | 3100 (Docker exposes `:3000`) |
| apps/web-jobs                      | NextJS 16, TS               | 3001                          |
| apps/web-board                     | NextJS 16, TS               | 3002                          |
| apps/web-settings                  | NextJS 16, TS               | 3003                          |
| apps/api                           | NestJS, TS                  | 4000                          |
| services/scraper                   | FastAPI, Python             | 8001                          |
| services/llm                       | FastAPI + LangGraph, Python | 8002                          |
| n8n (existing)                     | container                   | 5678                          |
| Postgres 17 (`pg-learn`, existing) | container                   | 5432                          |
| Redis                              | container                   | 6379                          |

## Microservices + micro-frontends

- Backend: independently deployable API / scraper / LLM; schema-per-concern;
  HTTP or Redis only between services.
- Frontend: `web-shell` composes remotes with **Next.js multi-zone path
  rewrites** + `assetPrefix`. Browser API calls go to the shell’s same-origin
  `/api` proxy (not rewritten to a remote). **Not** Module Federation; **not** iframes.
- Shared packages: `web-ui`, `web-api`, `shared-ts`.

## Non-negotiable rules

- Layering per service: `presentation → application → domain ← infrastructure`;
  domain has **zero framework imports**; ports in `application/ports`.
- Each service owns its schema (`core.*`, `scraper.*`, `llm.*`); cross-service
  access only via HTTP or Redis queue — never another service's tables.
- n8n = cron/notifications only; LangGraph = all agentic LLM logic (ADR-001).

## Data flow

n8n cron → `POST /scrape/{source}` → scraper (adapter fetch → `jobs_raw` →
dedup → enqueue) → llm worker (LangGraph: normalize → summarize+tags+red-flags
→ match → cover letter if score ≥ threshold) → webhook → n8n (Telegram/email)
→ shell/remotes read via api.

## Key ports

- `SourceAdapter` (scraper): `slug`, `discover(query)`, `fetch_detail(lead)`;
  strategy ladder API → crawl4ai → agent-browser (ADR-006).
- `LLMProvider` (llm): ollama / ollama-cloud / openai-compatible / anthropic;
  active provider = DB row flag, hot-switch via LISTEN/NOTIFY + 30s TTL (ADR-005).

## Testing

Unit: Vitest (api + remotes + packages) / pytest · Contract: supertest/
schemathesis · Scrapers: recorded HTML fixtures · E2E: Playwright in
`apps/web-shell` (CI job in `.github/workflows/ci.yml`).

Related: [decisions](decisions.md) · [project-overview](project-overview.md) ·
[current-state](current-state.md)
