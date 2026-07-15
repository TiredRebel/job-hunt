# Architecture Decision Records

## ADR-001: Hybrid orchestration — n8n + LangGraph
**Status:** accepted · 2026-07-15
**Context:** Requirements list both n8n workflows and LangGraph/LangChain/CrewAI. They overlap but excel at different things. n8n is already running locally (:5678).
**Decision:** n8n owns scheduling/triggers/notifications; LangGraph owns in-code agentic LLM pipelines inside `services/llm`. n8n workflows contain no business logic.
**Consequences:** Two systems to maintain, but each does what it is best at; LLM logic stays unit-testable and versioned; schedules stay tweakable without deploys.

## ADR-002: Mixed language stack (Python + TypeScript)
**Status:** accepted · 2026-07-15
**Context:** crawl4ai, LangGraph, LLM tooling are Python-first; NextJS and agent-browser are TS/Node.
**Decision:** Python (FastAPI) for `scraper` and `llm` services; TypeScript for `web` (NextJS) and `api` (NestJS). Contracts via OpenAPI with generated TS client.
**Consequences:** Polyglot repo (two toolchains), mitigated by monorepo layout, per-language linters, and contract-first APIs.

## ADR-003: Single Postgres 17, schema-per-service
**Status:** accepted · 2026-07-15
**Context:** Existing `pg-learn` Postgres 17 container at localhost:5432. True DB-per-service is overkill for a single-user local app.
**Decision:** One database `jobhunter`; schemas `core`, `scraper`, `llm` owned by respective services; cross-service access only via APIs/queue. Plain SQL migrations with dbmate (language-neutral).
**Consequences:** Simple ops; ownership discipline enforced by convention + review, not by network isolation.

## ADR-004: Redis as queue/pub-sub
**Status:** accepted · 2026-07-15
**Context:** Scraper→LLM handoff needs backpressure and retry; a full broker (RabbitMQ/Kafka) is oversized.
**Decision:** Redis + arq for async jobs; Postgres LISTEN/NOTIFY for config-change signaling (LLM hot switch).
**Consequences:** One extra lightweight container; simple mental model.

## ADR-005: LLM hot-switch via DB registry
**Status:** accepted · 2026-07-15
**Context:** Requirement: switch active LLM (local Ollama / Ollama Cloud / other providers) on the fly.
**Decision:** `core.llm_providers` table with an active flag + per-pipeline overrides; llm service caches config and invalidates via LISTEN/NOTIFY (30s TTL fallback). API keys stay in env vars; DB stores only env var *names*.
**Consequences:** No restarts on switch; secrets never persisted in DB; adding a provider = one row + one adapter class (for non-OpenAI-compatible APIs).

## ADR-006: Scraping strategy ladder — API → crawl4ai → agent-browser
**Status:** accepted · 2026-07-15
**Context:** Sources differ wildly: Reddit has an API; work.ua/job.ua/dou.ua are mostly SSR HTML; Upwork has aggressive anti-bot protection.
**Decision:** Per-adapter strategy: prefer official APIs/RSS, then crawl4ai for static HTML, agent-browser only for JS-heavy pages. Upwork is explicitly best-effort (see SOURCES.md); no CAPTCHA bypassing or bot-detection evasion will be implemented.
**Consequences:** Cheap and robust for UA job boards; honest limitation on Upwork documented up-front.

## ADR-007: NestJS for API gateway
**Status:** accepted · 2026-07-15
**Context:** Need a TS backend with first-class DI, modules, OpenAPI generation — aligned with Clean Architecture.
**Decision:** NestJS for `apps/api`; NextJS stays a thin frontend (its API routes used only for BFF-ish session concerns).
**Consequences:** Slightly heavier than Fastify alone, but structure, testability and OpenAPI tooling come built-in.
