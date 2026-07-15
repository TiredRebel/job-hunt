---
updated: 2026-07-15
sources: [../../docs/ARCHITECTURE.md]
---

# Architecture digest

Full detail: `docs/ARCHITECTURE.md`. This page is the fast-restore digest.

## Services

| Service                            | Stack                       | Port |
| ---------------------------------- | --------------------------- | ---- |
| apps/web                           | NextJS 15, TS               | 3000 |
| apps/api                           | NestJS, TS                  | 4000 |
| services/scraper                   | FastAPI, Python             | 8001 |
| services/llm                       | FastAPI + LangGraph, Python | 8002 |
| n8n (existing)                     | container                   | 5678 |
| Postgres 17 (`pg-learn`, existing) | container                   | 5432 |
| Redis                              | container                   | 6379 |

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
→ web reads via api.

## Key ports

- `SourceAdapter` (scraper): `slug`, `discover(query)`, `fetch_detail(lead)`;
  strategy ladder API → crawl4ai → agent-browser (ADR-006).
- `LLMProvider` (llm): ollama / ollama-cloud / openai-compatible / anthropic;
  active provider = DB row flag, hot-switch via LISTEN/NOTIFY + 30s TTL (ADR-005).

## Testing

Unit: Vitest/pytest (application+domain ≥80%) · Contract: supertest/schemathesis
vs OpenAPI · Scrapers: recorded HTML fixtures, no live calls in CI · E2E: Playwright.

Related: [decisions](decisions.md) · [project-overview](project-overview.md)
