---
updated: 2026-07-19
sources:
  [
    ../../PROGRESS.md,
    ../../openspec/changes/phase-7-hardening/tasks.md,
    ../../docs/ARCHITECTURE.md,
    ../../docs/DEPLOYMENT.md,
    ../../.github/workflows/ci.yml,
  ]
---

<!-- checkpoint: Phase 7 hardening committed, security-reviewed and hardened further, archived, pushed, and CI-verified end to end. Three real CI runs green, continue-on-error removed from the e2e job. Two genuine infra bugs found and fixed live in CI: tsx/esbuild breaking NestJS DI app-wide, and an e2e locator strict-mode violation. -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-19)

**Phases 0–6 are complete and committed.** Since then, three ad-hoc
OpenSpec changes shipped and are committed + archived: `sources-page-crud`,
`llm-settings-config`, `llm-provider-delete-and-model-picker` (real
per-provider connectivity test, live model lists, provider CRUD including
delete, and a rebuilt model combobox — the last of these fixed a real
click/browsability bug, verified live via a Playwright pass once Chrome
became reachable in this environment). A same-day DB-loss incident
(`pg-learn`'s bind mount vanished after a Docker Desktop restart) was
recovered from and the container migrated to a named Docker volume,
verified to survive a full `docker rm`+recreate. Full history for all of
this is in `log.md` and `PROGRESS.md` — not repeated here since it's
settled, not current.

### ✅ Phase 7 — Hardening: fully implemented, committed, archived, and CI-verified (2026-07-19)

OpenSpec `phase-7-hardening` closed all four remaining Phase 7 checklist
items in one coordinated pass (51 tasks, 9 groups — see
`openspec/changes/phase-7-hardening/tasks.md` for the full per-group
detail, and `PROGRESS.md`'s 2026-07-19 log entry for the comprehensive
summary). Highlights:

- **Correlation ids end to end**: `X-Correlation-Id` propagates web `/api`
  proxy → gateway (adopted as pino's `req.id`, threaded via `nestjs-cls`
  to 3 HTTP clients) → scraper/LLM (new ASGI middleware + JSON logging).
  Verified live against the rebuilt Docker stack, including through the
  web proxy and in an actual application-level log line (not uvicorn's own
  access logger, which correctly shows `null` — it runs outside any
  application middleware).
- **Coverage gates**: `@vitest/coverage-v8` (api, web) + `pytest-cov`
  (scraper, llm), all scoped to domain/application (not thin
  controllers/DTOs/infra adapters) with thresholds set from measured
  coverage, never guessed. Verified each gate genuinely fails when unmet —
  caught a real `pytest-cov` subtlety where a `fail_under` within rounding
  distance of the actual value prints "FAIL" without failing the exit code.
- **Rate limiting**: `@nestjs/throttler` on the gateway, internal automation
  routes exempt. Originally keyed on `X-Forwarded-For` unconditionally when
  present — a same-day security review caught this as a rate-limit-bypass
  vector (any direct caller can spoof the header) and it's now gated
  behind `TRUST_PROXY_HEADERS` (default `false`, socket address otherwise).
  Known limitation even when enabled: the web proxy doesn't forward
  `X-Forwarded-For` yet, so browser traffic through it is bucketed
  coarsely rather than per-browser-client (checked this Next.js version's
  bundled docs first — no client-IP accessor exists in Route Handlers here
  to do better without a separate change).
- **Per-source politeness**: `PolitenessGate` gained per-call overrides; a
  new `SourceBoundFetcher` wrapper applies a source's `core.sources.config`
  politeness keys transparently, with zero changes needed to any adapter.
- **Retries**: new `fetchWithRetry` (gateway) wired into safe/idempotent
  calls only, with explicit comments on every un-retried call explaining
  why (run-creation, attempt-counter increments, resource
  creation/deletion, cover-letter generation's cost + non-determinism).
  LLM provider calls wrapped in `tenacity` inside the shared `providers/base.py`.
- **Dead-letter**: `GET /jobs_raw/dead-letter` (scraper) → `GET
/v1/automation/jobs/dead-letter` (gateway), OpenAPI + shared-ts regenerated.
- **E2e CI job** — a real design pivot found during implementation:
  `infra/docker-compose.yml` assumes a pre-existing host Postgres (doesn't
  fit CI), and Playwright's own config already boots the web app natively —
  so the job uses `docs/DEPLOYMENT.md` §8.2's native-process approach with a
  GitHub Actions `postgres:17` service container instead, seeding one real
  `core.jobs` row so the happy path exercises the full flow.

**Gates green throughout**: scraper 89/89 pytest (+1 skipped, 93.78%
coverage), llm 70/70 pytest (98.76%), api 117/117 vitest, web 56/56 vitest,
shared-ts build — all typecheck/lint/format/mypy clean.

**Committed** (`119a185`) and **archived** (`8939d02`, delta specs synced
into `openspec/specs/`: new `observability`, `api-rate-limiting`,
`request-resilience`, `quality-gates` capabilities; modified
`fetch-strategy-ladder` and `processing-chain`).

### Post-commit hardening + real CI verification (same day)

A background security review on the Phase 7 commit found three real,
confirmed vulnerabilities — all fixed (`5bf3704`), all with new tests:
XFF-based rate-limit bypass (now gated behind `TRUST_PROXY_HEADERS`,
default `false`), an unbounded `Retry-After`/backoff delay in
`fetchWithRetry` (now capped at `MAX_DELAY_MS`), and an unvalidated
client-supplied `X-Correlation-Id` flowing into logs/headers everywhere it
was read (now format/length-validated, falling back to a minted id).

Pushed to `origin/master` and watched real CI for the first time — it
immediately paid off. **The `e2e` job failed identically on its first two
runs**: not flaky, not a data bug — `apps/api`'s `npm run dev` (`tsx
watch`, esbuild) silently breaks NestJS's constructor-based DI. The
gateway boots and maps every route with zero errors, but every
controller's injected service reads as `undefined` at request time, so
every real endpoint past `/health` 500s. Confirmed by an independent local
repro (identical failure under `tsx watch`, clean under the real `tsc`
build) — this was invisible until now because local dev always went
through Docker. Fixed (`5d428d0`) by having CI build+run the compiled
gateway instead of `tsx watch`, same path the Docker image already uses;
documented in `docs/DEPLOYMENT.md` §8.2 and in a project memory note. That
fix surfaced a second, separate e2e bug (`0011174`): the `openJobs()`
locator matched multiple `role="region"` landmarks on the real (now
correctly rendering) page, tripping Playwright's strict mode — fixed by
matching `main` alone. Three consecutive real CI runs then passed clean,
including one with `continue-on-error: true` fully removed (`8915790`) —
the e2e job now genuinely gates the pipeline.

## Next up

- Consider forwarding `X-Forwarded-For` from the web `/api` proxy so rate
  limiting buckets by real browser client, not just by the web container's
  address — a scoped follow-up, not guessed at during Phase 7 or its
  security hardening.
- If real Ollama models drift again, `ollama-local`'s default model may
  need re-picking (currently `qwen3.5:9b`, confirmed installed on
  2026-07-19).
- No further Phase 7 items open — this closes the phase's last checklist
  item (CI pipeline, now genuinely gating). Next phase of work is
  unscoped; check with the user for direction.

## In-flight / open threads

- **agent-browser's CLI contract is unverified** — before relying on
  `agent-browser`-strategy scraping for real, install it locally
  (`npm i -g agent-browser && agent-browser install`), run `agent-browser
skills get core --full` to get the authoritative command reference, and
  adjust `SCRAPER_AGENT_BROWSER_CMD` / the output-parsing logic in
  `agent_browser.py` if the real contract differs from the `read [url]`
  guess.
- **Live end-to-end smoke of the n8n workflows is still an operator step**:
  no Telegram bot / SMTP credentials exist yet. See `n8n/README.md`
  "Verifying end to end".
- Redis/arq queue handoff between scraper and llm (ARCHITECTURE.md mentions
  it) was explicitly **not** built — the processing chain polls the
  gateway instead; revisit if scale demands it.
- Dictionary enable is **per-dictionary** (API has no per-item enabled flag).
- No HTTP-level route-order test exists for `GET /sources/adapters` vs
  `GET /sources/:slug` (verified by code reading instead) — this repo has
  no supertest/e2e-controller harness yet; introduce one if a second
  same-verb route-ordering case ever comes up.
- No component-rendering tests exist for any web admin page (Sources,
  Dictionaries, Profile, LLM Settings) — only `lib/api/*` client-layer
  tests, and this is exactly why Phase 7's web coverage gate is scoped to
  `src/lib/**` rather than the whole tree. A real, acknowledged gap.

## Resume commands

```powershell
cd E:\job-hunter
npm install
cd services\llm; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd services\scraper; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd apps\api; npm run typecheck; npm run lint; npm run test; npm run build; cd ..\..
cd packages\shared-ts; npm run typecheck; npm run lint; npm run build; cd ..\..
cd apps\web
npm run typecheck; npm run lint; npm run test; npm run build
# e2e (optional — needs API on :4000 + seed):
npm run test:e2e:install
npm run test:e2e
cd ..\..
cat PROGRESS.md

# Or bring up the full stack via Docker (see docs/DEPLOYMENT.md):
docker compose -f infra/docker-compose.yml --profile services up -d --build
```
