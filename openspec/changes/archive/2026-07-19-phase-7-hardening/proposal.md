## Why

Phases 0–6 delivered end-to-end function, but the four Phase 7 "Hardening"
checklist items in `PROGRESS.md` are still open: the codebase has **no
coverage enforcement**, Python services emit **unstructured logs with no
correlation id**, the API gateway has **no rate limiting**, scraper
politeness is **process-global rather than per-source**, and cross-service
HTTP calls have **no retry/backoff**. These are the operational gaps that
turn a working demo into a system you can run unattended, debug from logs,
and trust under transient failure. This change closes all four in one
coordinated pass so the observability and resilience story is consistent
across every service rather than bolted on service-by-service.

## What Changes

- **Structured logging + correlation ids.** Both Python services
  (`services/scraper`, `services/llm`) switch stdlib `logging` to JSON
  output and gain an ASGI middleware that reads (or mints) an
  `X-Correlation-Id`, binds it to every log line, and echoes it on the
  response. The gateway's `nestjs-pino` is configured to adopt an incoming
  `X-Correlation-Id` (or generate one) as its request id, and its three
  downstream HTTP clients propagate that id on every call. The web `/api`
  proxy forwards an incoming id and mints one when absent. Net effect: one
  id follows a request browser → gateway → scraper/LLM and appears in all
  four services' logs.
- **Coverage gates + e2e in CI.** Add coverage tooling and thresholds:
  `@vitest/coverage-v8` for `apps/api` + `apps/web`, `pytest-cov` for both
  Python services. Thresholds are scoped to the domain/application layers
  (per `CODING_STANDARDS.md` "≥ 80% on domain/application") and set by
  measuring current coverage first, then ratcheting — CI must not wedge on
  legacy infrastructure code. A new CI job runs the Playwright happy path
  against a booted, seeded stack.
- **API rate limiting.** Add `@nestjs/throttler` to the gateway with a
  global default limit; internal (n8n, `X-Internal-Token`) routes are
  exempt so automation is never throttled.
- **Per-source politeness.** The scraper's shared `PolitenessGate` gains
  per-source `min_delay` / `jitter` / `respect_robots`, read from
  `core.sources.config`, falling back to the global `Settings` defaults —
  keeping the "one shared gate, identical per-host decisions" guarantee.
- **Request resilience.** A small retry-with-backoff helper wraps the
  gateway's downstream scraper/LLM `fetch` calls (idempotent + safe
  requests only) and the LLM service's provider adapter calls (`tenacity`),
  retrying on transient network errors, 5xx, and 429. The processing
  chain's dead-letter attempt limit becomes configurable, and a gateway
  endpoint lists dead-lettered raw jobs for inspection (honoring the
  existing `processing-chain` "visible as failed for later inspection"
  scenario, which currently has no read path).

Tasks are scoped for implementation by **Sonnet 5**: each is concrete, names
exact files, carries acceptance criteria, and is grouped so every group is
independently verifiable against the existing gates.

## Capabilities

### New Capabilities

- `observability`: structured JSON logging in every service and end-to-end
  `X-Correlation-Id` propagation across web → gateway → scraper/LLM.
- `api-rate-limiting`: request throttling on the gateway's public endpoints,
  with internal-token automation routes exempt.
- `request-resilience`: retry-with-backoff for transient cross-service HTTP
  failures (gateway → scraper/LLM, LLM → provider).
- `quality-gates`: enforced test-coverage thresholds (TS + Python) on the
  domain/application layers and a Playwright happy-path job in CI.

### Modified Capabilities

- `fetch-strategy-ladder`: the "Politeness is enforced identically for every
  fetcher" requirement is extended so the per-domain delay, jitter, and
  robots toggle are configurable **per source** (from `core.sources.config`),
  while the single-shared-gate / identical-per-host-decision guarantee is
  preserved.
- `processing-chain`: the "Poison jobs are marked failed after repeated
  attempts" requirement gains a configurable attempt limit and a read path
  (gateway endpoint) to list dead-lettered raw jobs for inspection.

## Impact

- **Code — gateway (`apps/api`):** `main.ts` / logger module (correlation
  id as request id), the 3 `infrastructure/clients/http-*.client.ts` (id
  propagation + retry helper), new throttler wiring in `app.module.ts`, a
  new dead-letter listing endpoint in the automation module, config schema
  additions (`RATE_LIMIT_*`, downstream retry knobs).
- **Code — web (`apps/web`):** `app/api/[...path]/route.ts` (id
  forward/mint); coverage config.
- **Code — scraper (`services/scraper`):** new logging setup + ASGI
  correlation middleware, `PolitenessGate` per-source config plumbing
  through the fetcher factory, `Settings` additions.
- **Code — llm (`services/llm`):** logging setup + ASGI correlation
  middleware, `tenacity` retry on provider adapter calls, `Settings`
  additions.
- **Dependencies:** `@nestjs/throttler`, `nestjs-cls` (correlation
  propagation to clients), `@vitest/coverage-v8` (api+web) [npm];
  `pytest-cov`, `tenacity`, and a JSON-logging helper
  (`python-json-logger` or `structlog`) [uv, both services].
- **CI (`.github/workflows/ci.yml`):** coverage flags on existing jobs +
  a new e2e job.
- **Docs:** `ARCHITECTURE.md` §9/§10, `CODING_STANDARDS.md`,
  `DEPLOYMENT.md` (new env vars), `PROGRESS.md` Phase 7 checklist.
- **No breaking API changes.** New response header (`X-Correlation-Id`) and
  new env vars only; all defaults preserve current behavior.
