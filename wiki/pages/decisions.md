---
updated: 2026-07-15
sources: [../../docs/DECISIONS.md]
---

# Decisions digest (ADR-001…007, all accepted 2026-07-15)

| ADR | Decision                                                                                                                           | Key consequence                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 001 | Hybrid orchestration: n8n (schedules/notifications) + LangGraph (LLM pipelines in `services/llm`)                                  | n8n workflows carry no business logic; LLM logic unit-testable         |
| 002 | Mixed stack: Python (scraper, llm) + TypeScript (web, api)                                                                         | Contract-first OpenAPI + generated TS client bridges the two           |
| 003 | One Postgres 17 (`jobhunter`), schema-per-service (`core`/`scraper`/`llm`), dbmate SQL migrations                                  | Ownership by convention; simple ops                                    |
| 004 | Redis + arq for scraper→llm queue; Postgres LISTEN/NOTIFY for config signals                                                       | One lightweight extra container                                        |
| 005 | LLM hot-switch via `core.llm_providers` DB registry + active flag + per-pipeline overrides                                         | No restarts; secrets stay in env vars — DB stores env var _names_ only |
| 006 | Scraping ladder: official API/RSS → crawl4ai (SSR HTML) → agent-browser (JS-heavy); Upwork best-effort, **no CAPTCHA/bot-evasion** | Cheap & robust for UA boards; honest Upwork limits                     |
| 007 | NestJS for `apps/api`; NextJS stays thin frontend                                                                                  | DI, modules, OpenAPI generation built-in                               |

Full text with context/consequences: `docs/DECISIONS.md`.

Related: [architecture](architecture.md)
