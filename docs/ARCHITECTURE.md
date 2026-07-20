# Architecture

## 1. Goals & constraints

- **Configurable & modular**: every job source, pipeline, and LLM provider is a plug-in behind a port; enabling/disabling is configuration, not code.
- **Microservices**: independently deployable services with clear contracts (OpenAPI), one shared Postgres 17 (schema-per-concern) as the system of record.
- **Hybrid orchestration**: n8n for time-based triggers & notification fan-out; LangGraph for agentic, testable LLM pipelines.
- **Clean Architecture** in each service: dependencies point inward, domain has zero framework imports.

## 2. Services

| Service | Stack | Port | Responsibility |
|---|---|---|---|
| `apps/web` | NextJS 15, TS | 3000 | Dashboard, profile editor, LLM switcher, sources admin |
| `apps/api` | NestJS, TS | 4000 | API gateway: auth, aggregation, OpenAPI contract for web |
| `services/scraper` | FastAPI, Python | 8001 | Source adapters, scrape runs, dedup, raw persistence |
| `services/llm` | FastAPI + LangGraph, Python | 8002 | Provider hub, normalize/tag/match/cover-letter pipelines |
| n8n (existing) | container | 5678 | Cron schedules, Telegram bot, email digest |
| Postgres 17 (existing `pg-learn`) | container | 5432 | Database `jobhunter` |
| Redis | container | 6379 | Work queue (arq) + pub/sub between scraper→llm |

## 3. Layering (every service)

```
presentation/    HTTP controllers, DTOs, serialization    (FastAPI routers / Nest controllers / Next routes)
application/     use-cases, orchestration, ports           (pure, tested to ≥80%)
domain/          entities, value objects, domain services  (zero framework imports)
infrastructure/  DB repos, HTTP clients, LLM SDKs, adapters (implements ports)
```

Rules:
- `domain` imports nothing from outer layers.
- `application` depends only on `domain` + port interfaces.
- Ports (interfaces/Protocols) live in `application/ports`; implementations in `infrastructure`.
- Cross-service communication is HTTP (sync) or Redis queue (async) — never direct DB access to another service's tables (each service owns its schema: `scraper.*`, `llm.*`, `core.*`).

## 4. Data flow

```
n8n cron ──POST /scrape/{source}──▶ scraper
scraper: adapter fetch → raw persist (jobs_raw) → dedup → enqueue(job_id)
llm worker: dequeue → LangGraph graph:
    normalize/extract → summarize+tags+red-flags → match vs active profile → (score ≥ threshold?) cover-letter draft
    persist jobs, job_matches, cover_letters
llm ──webhook──▶ n8n: new-matches event
n8n: Telegram push (score ≥ threshold) · daily email digest (query via api)
web ◀── api ◀── Postgres (read models)
```

Normalized job deletion is an explicit, confirmed user action from the jobs
list or reaction board. The gateway deletes only `core.jobs` in a transaction;
database foreign keys clean up user-facing dependents while retaining
`scraper.jobs_raw` provenance and scrape-run history.

## 5. Source adapters (scraper)

`SourceAdapter` port:

```python
class SourceAdapter(Protocol):
    slug: str                      # "dou", "workua", "jobua", "upwork", "reddit"
    async def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]: ...
    async def fetch_detail(self, lead: JobLead) -> RawJobPosting: ...
```

Fetch strategies (composable, per-adapter config):
1. **API-first** — Reddit JSON API; anything with RSS.
2. **crawl4ai** — static/SSR HTML (dou.ua, work.ua, job.ua).
3. **agent-browser** — fallback for JS-heavy or interactive pages.

Politeness: per-domain rate limits, jitter, robots.txt respect, incremental scraping via `last_seen_at` watermark. See docs/SOURCES.md for per-site strategy and risk notes (Upwork anti-bot is documented as best-effort).

### Static HTML adapter design

DOU, Work.ua, and Job.ua use one shared `StaticHtmlAdapter` lifecycle. Each
source provides an immutable, frozen definition containing its slug, default
list URL, search parameter, detail-content selector, and source-specific
`parse_list` callable. The shared adapter owns URL overrides, list discovery,
detail fetching, raw-text extraction, fingerprinting, and connectivity probes;
the three parsers remain independent repair and fixture-test seams because
their markup is not interchangeable.

The registry wires each adapter through explicit immutable registration
metadata: an adapter factory and an optional content-probe selector. The
static-source builder derives both values from the same source definition, so
fetcher escalation does not inspect undeclared adapter class attributes. Reddit
and Upwork remain dedicated adapters: Reddit uses API/JSON behavior, while
Upwork has materially different feed, caching, and anti-bot constraints. They
do not share the static HTML lifecycle and therefore register without an HTML
content probe.

The architecture-review recommendations to collapse NestJS application
services are deferred. Those services contain orchestration, not-found and
conflict translation, bulk-operation guards, and remote-error mapping; direct
controller-to-repository wiring would cross the documented application/port
boundary. A shared LLM exception mapper is also deferred because it currently
has one consumer. OpenAPI-generated web resources are speculative and
high-surface, and provider-kind cleanup is unrelated to this scraper change.

## 6. LLM provider hub (llm service)

- `LLMProvider` port with implementations: `ollama` (local), `ollama-cloud`, `openai-compatible` (covers OpenRouter/Groq/vLLM/LM Studio), `anthropic`.
- Registry reads `core.llm_providers`; **active** provider is a DB row flag.
- Hot switch: dashboard → api → `PUT /providers/active` → llm service updates row + `NOTIFY llm_config_changed`; workers re-resolve provider on next task (in-memory cache invalidated by LISTEN or 30s TTL fallback).
- Per-pipeline overrides allowed (e.g. cheap model for tagging, strong model for cover letters) via `llm_providers.pipeline_overrides` JSONB.
- Secrets (API keys) are **not** stored in the DB — DB rows reference env var names; values live in `.env`.

## 7. Orchestration split (n8n vs LangGraph)

| Concern | Owner | Why |
|---|---|---|
| Cron schedules, retries of whole runs | n8n | visual, easy to tweak cadence without deploys |
| Telegram / email delivery | n8n | built-in nodes, credentials UI |
| Multi-step LLM reasoning, structured output, branching | LangGraph | versioned, unit-testable, typed state |
| Scrape→process handoff | Redis queue | decouples services, backpressure |

n8n workflows are exported to `n8n/workflows/*.json` and versioned; they contain **no business logic**, only triggers + HTTP calls + notification formatting.

## 8. Configuration

- `.env` per environment (see `.env.example`); each service reads a validated, typed config (pydantic-settings / zod).
- Runtime-tunable settings (thresholds, schedules metadata, active LLM) live in `core.app_settings` and are editable from the dashboard.

## 9. Observability

- Structured JSON logs (`python-json-logger` in `services/scraper`/`services/llm`; `nestjs-pino` in `apps/api`) carrying a `correlation_id` field.
- A single `X-Correlation-Id` header follows one request across every hop: the web app's same-origin `/api` proxy forwards an incoming value or mints one (`crypto.randomUUID()`), the gateway adopts it as pino's own request id (`genReqId`) and propagates it to CLS (`nestjs-cls`) for its downstream HTTP clients, and each Python service reads/mints it via an ASGI middleware and binds it to every log line for that request. Every service echoes the id back on its own response.
- `LOG_LEVEL` is configurable per service (`SCRAPER_LOG_LEVEL`, `LLM_LOG_LEVEL`, the gateway's existing `LOG_LEVEL`).
- `/health` on every service. `/metrics` (Prometheus-format) is not yet implemented — deferred past Phase 7 hardening (see PROGRESS.md); this section previously listed it as done, which was aspirational, not actual.

## 10. Testing strategy

| Layer | TS | Python |
|---|---|---|
| Unit (domain/application) | Vitest, coverage-gated (`@vitest/coverage-v8`, scoped to `*.service.ts`/`*.guard.ts`/interceptors in `apps/api`; `src/lib/**` in `apps/web`) | pytest, coverage-gated (`pytest-cov`, scoped to domain/application modules — excludes DB glue, FastAPI app-lifecycle wiring, and concrete IO-transport adapters) |
| Contract (API) | generated client + supertest | schemathesis against OpenAPI |
| Adapter (scrapers) | — | pytest + recorded HTML fixtures (no live calls in CI) |
| E2E | Playwright (web happy path), a dedicated CI job (native Postgres + scraper/LLM/gateway processes, not the dev-oriented Docker Compose file) | — |

Coverage thresholds are set from each package's measured coverage at the
time the gate was introduced, then only ratcheted upward — never a blanket
percentage guessed in advance (see design.md D4 in
openspec/changes/phase-7-hardening). Every service's rate-limiting,
retry, and per-source-politeness behavior (§9's correlation-id chain aside)
is documented in the `api-rate-limiting`, `request-resilience`, and
`fetch-strategy-ladder` capability specs under `openspec/specs/`.
