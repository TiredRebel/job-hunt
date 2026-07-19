## Context

Phases 0–6 are complete; the four open Phase 7 items in `PROGRESS.md`
(coverage gates, structured logging/correlation ids, rate-limit/politeness,
retries/dead-letter) are the operational-hardening layer. Current state,
verified against the code:

- **Logging.** `apps/api` uses `nestjs-pino` (auto `reqId`) but never
  forwards an id downstream — its three clients
  (`infrastructure/clients/http-{scraper,llm-admin,llm-cover-letter}.client.ts`)
  send only `Content-Type` + `X-Internal-Token`. Both Python services use
  bare `logging.getLogger(__name__)` with no configured handler (they
  inherit uvicorn's plain-text default) and no correlation context. The web
  `app/api/[...path]/route.ts` proxy forwards only `Content-Type`.
- **Coverage.** No `@vitest/coverage-v8` in `apps/api`/`apps/web`; no
  `pytest-cov` in either Python service; vitest configs and pytest
  `ini_options` set no thresholds. CI runs `npm run check` + `npm run build`
  and per-service `ruff`/`mypy`/`pytest -q`. Playwright e2e exists in
  `apps/web` but is intentionally out of CI (needs a live API + seed).
- **Politeness.** `services/scraper/src/scraper/fetchers/gate.py`
  (`PolitenessGate`) already does robots caching + per-host min-delay+jitter
  under per-host locks, shared across the fetch ladder — but it is
  constructed once from process-global `Settings` (`min_delay_seconds=2.0`,
  `jitter_seconds=1.0`), not per source.
- **Rate limiting.** The gateway has none (`@nestjs/throttler` absent).
- **Dead-letter.** `scraper.db.mark_processed(status, max_attempts)` already
  increments `process_attempts` and flips `processing_status='failed'` at the
  limit; `processing-chain` spec's poison-job requirement covers it. But the
  attempt limit is passed at the call site (not env-configurable in an
  obvious way) and there is **no read path** to list dead-lettered jobs. The
  gateway's downstream `fetch` calls and the LLM provider adapter calls have
  **no retry/backoff**.

Constraint from the request: the tasks must be **implementable by Sonnet 5**
— concrete, file-scoped, with acceptance criteria and independently
verifiable groups. The repo's gates (`ruff`, `mypy --strict`, `vitest`,
`tsc`, `eslint`, `pytest`) are the contract each group must keep green.

## Goals / Non-Goals

**Goals:**

- One correlation id visible in all four services' logs for a single
  request, propagated by header, minted at the edge when absent.
- Structured JSON logs in the two Python services; keep the gateway's
  existing pino JSON but adopt the incoming id as its request id.
- Coverage measured and gated on domain/application layers, set by
  measuring-then-ratcheting so CI does not wedge on legacy code.
- A Playwright happy-path job in CI against a booted, seeded stack.
- Gateway rate limiting with internal automation routes exempt.
- Per-source politeness config layered on the existing shared gate.
- Retry-with-backoff for transient gateway→scraper/LLM and LLM→provider
  calls; a configurable dead-letter limit and a listing endpoint.

**Non-Goals:**

- Prometheus `/metrics` endpoints (ARCHITECTURE §9 mentions them, but they
  are not on the Phase 7 checklist — defer).
- Distributed tracing / OpenTelemetry spans (correlation id by header is the
  scoped deliverable, not full tracing).
- A Redis/arq queue between scraper and llm (explicitly deferred; the
  processing chain still polls the gateway).
- Retrying non-idempotent operations or scrape runs inside the services
  (whole-run retries remain n8n's job per ARCHITECTURE §8).
- Raising coverage of existing code to a fixed 80% in this change — the gate
  is set at current levels and ratcheted; writing net-new tests to reach a
  target is follow-up work, not a blocker here.

## Decisions

### D1 — Correlation id: header `X-Correlation-Id`, minted at the edge, adopted downstream

One header name across the stack: `X-Correlation-Id`. Each service reads it,
mints a UUID if absent, binds it to logs, echoes it on the response, and
forwards it on outbound calls. Rationale: a plain header is the lowest-common
denominator that works across NestJS, FastAPI, and the Next proxy without a
tracing backend. Alternative considered: W3C `traceparent` — richer, but
implies OTel tooling we are explicitly not adopting here; a single id covers
the "grep one id across four logs" goal.

### D2 — Gateway propagation via `nestjs-cls`, not request-scoped clients

The gateway's HTTP clients are singletons; they need the current request's
id. Use `nestjs-cls` (`ClsModule`) to stash the id per request (populated
from `nestjs-pino`'s `genReqId`, which reads/mints `X-Correlation-Id`), and
have each client read `cls.get('correlationId')` to set the outbound header.
Alternative considered: making clients `@Injectable({ scope: REQUEST })` —
viral scope changes across the DI graph and a known Nest performance/ergonomics
cost. Alternative: raw `AsyncLocalStorage` by hand — `nestjs-cls` is the
maintained, Nest-native wrapper over exactly that. Configure `nestjs-pino`
`genReqId` to return the incoming `X-Correlation-Id` or a new UUID and set the
response header there, so pino's `reqId` and the propagated id are the same value.

### D3 — Python: stdlib logging + JSON formatter + ASGI middleware + `contextvar`

Keep stdlib `logging` (already used); add a JSON formatter via
`python-json-logger` and a `logging.config` setup called at startup in each
`main.py`. A `contextvars.ContextVar` holds the current correlation id; a
small logging filter injects it into every record. A single ASGI middleware
(shared shape in each service) reads/mints `X-Correlation-Id`, sets the
contextvar, and adds the response header. Rationale: no framework rewrite,
`mypy --strict`-friendly, and `python-json-logger` is a tiny well-established
dep. Alternative considered: `structlog` — more powerful but a larger
conceptual change to how these services log; `loguru` (named in ARCHITECTURE)
— pleasant but harder to make emit strict-typed structured records and to
integrate with uvicorn's loggers. Stdlib+formatter is the least-risk path and
keeps both services identical.

### D4 — Coverage: measure first, scope to domain/application, ratchet

Add `@vitest/coverage-v8` (api, web) and `pytest-cov` (both services). Before
setting any threshold, run coverage once and read the current numbers; set the
gate at (or just below) the current domain/application figure, never a blanket
80% on the whole tree. Scope via coverage `include`/`omit`: TS includes
`src/domain` + `src/application` (excludes `infrastructure`, generated code,
`main.ts`, DTOs); Python `--cov` targets the domain/application modules, not
adapters/db glue. Rationale: `CODING_STANDARDS.md` targets 80% on
domain/application specifically; a whole-tree gate would fail immediately on
thin adapters and generated clients. The threshold is a ratchet — it can only
be raised later, never silently lowered.

### D5 — Rate limiting: `@nestjs/throttler` global guard, internal routes `@SkipThrottle`

Register `ThrottlerModule` with env-driven `RATE_LIMIT_TTL` /
`RATE_LIMIT_LIMIT`, apply `ThrottlerGuard` globally via `APP_GUARD`, and mark
the `/v1/automation` controller (internal-token) with `@SkipThrottle()`.
Configure the throttler to key on the real client via
`getTracker`/trust-proxy so the shared web `/api` proxy hop does not collapse
all browser traffic into one bucket. Rationale: first-party Nest module,
declarative exemption, no custom middleware. Alternative considered: a
hand-rolled in-memory limiter — reinvents a maintained module. (Storage stays
in-memory; a Redis throttler store is a scale-time follow-up, noted as a risk.)

### D6 — Resilience: hand-rolled `fetchWithRetry` (gateway) + `tenacity` (llm)

Gateway: a small `withRetry`/`fetchWithRetry` helper in
`apps/api/src/infrastructure/clients/` — bounded exponential backoff + jitter,
retry only on network error / 5xx / 429, honor `Retry-After` when present,
env-configurable max attempts (`DOWNSTREAM_RETRY_ATTEMPTS`), applied to the
idempotent/safe client calls (GET feeds, adapter list, the side-effect-free
source test; the scrape-trigger POST is safe to retry only on connect/5xx
before any run row is returned — treat conservatively). LLM service: wrap the
provider adapter HTTP calls with `tenacity` (`retry_if_exception_type` +
`wait_exponential_jitter` + `stop_after_attempt`), env-configurable. Each
retry logs at warning under the correlation id. Rationale: the gateway needs
one tiny dependency-free util that also emits the correlation-scoped warning;
`tenacity` is the idiomatic Python choice and avoids hand-rolling async
backoff. Alternative considered: `p-retry`/`cockatiel` on the TS side — extra
dep for ~30 lines we want full control over (transient classification +
logging).

### D7 — Per-source politeness: pass overrides at `acquire`, keep one gate

Rather than one `PolitenessGate` per source (which would fragment the per-host
budget and could let two sources hammer a shared host), keep the single shared
gate and thread per-source overrides (`min_delay` / `jitter` /
`respect_robots`, read from `core.sources.config`) into the pacing decision —
e.g. `acquire(url, min_delay=…, jitter=…, respect_robots=…)` with the
service-global `Settings` values as defaults. The per-host lock, last-request
map, and robots cache stay shared and authoritative. Rationale: preserves the
`fetch-strategy-ladder` "one shared gate, identical per-host decision"
guarantee (its existing scenarios still hold) while making the values
per-source. The overrides plumb through `build_fetcher_factory` /
`EscalatingFetcher`, which already receive per-source context.

### D8 — Dead-letter: env-configurable limit + read-only listing endpoint

Make the attempt limit an env var (`PROCESSING_MAX_ATTEMPTS`) read by the
gateway's automation service and passed to the scraper's `mark` call (or read
by the scraper for its `mark_processed` default). Add a gateway read endpoint
(e.g. `GET /v1/automation/jobs/dead-letter`) that proxies a new scraper
`GET /jobs_raw/dead-letter` returning rows in `processing_status='failed'`
with id/source/url/attempt count. Rationale: satisfies the `processing-chain`
"visible as failed for later inspection" scenario, which today has no read
path. Keeps schema ownership intact (the gateway never queries
`scraper.jobs_raw` directly; it goes through the scraper service).

## Risks / Trade-offs

- **Coverage gate wedges CI on legacy code** → set thresholds from measured
  current values (D4), scoped to domain/application; ratchet up only. Never
  commit a blanket 80%.
- **`nestjs-cls` / pino `genReqId` wiring is subtle** (id must be the _same_
  value pino logs and clients forward) → one source of truth: `genReqId`
  reads/mints and writes to both the pino `reqId` and the CLS store; clients
  read only from CLS. Add a unit test asserting an inbound id reaches an
  outbound client header.
- **E2e-in-CI is the flakiest, slowest piece** → give it its own job that
  boots the compose stack + seeds, and keep it a required-but-isolated job so
  a flaky e2e never masks a real unit failure; start it non-blocking
  (`continue-on-error`) only if first-run flakiness demands, and remove that
  once stable (call out in tasks).
- **Retrying the scrape-trigger POST could double-start a run** → only retry
  it on pre-response transient errors (connect refused / 5xx before a body);
  never retry once a `runId` is returned. Feeds/list/test calls are safe.
- **In-memory throttler store is per-instance** → acceptable at current
  single-instance deployment; note Redis store as a scale-time follow-up.
- **New response header / env vars** → additive only; every default preserves
  current behavior, so rollback is "unset the vars / revert the module
  registration."

## Migration Plan

1. Land in group order (see tasks.md): logging+correlation → coverage →
   rate-limit+politeness → resilience+dead-letter → CI/docs. Each group keeps
   all existing gates green before the next starts.
2. New env vars ship with defaults in every `.env.example` and
   `docker-compose.yml`; `DEPLOYMENT.md` documents them. No data migration —
   no schema change (dead-letter reads an existing column/state).
3. Rollback is additive-reversal: unset the new env vars (defaults restore
   prior behavior), or revert the module/middleware registration commits;
   nothing is destructive or stateful.

## Open Questions

- Coverage thresholds' exact numbers are **measured during implementation**
  (D4), not guessed here — the first coverage run sets them.
- Whether the e2e CI job reuses `infra/docker-compose.yml --profile services`
  or a slimmer test compose is an implementation choice left to the CI task,
  as long as it boots + seeds deterministically.
