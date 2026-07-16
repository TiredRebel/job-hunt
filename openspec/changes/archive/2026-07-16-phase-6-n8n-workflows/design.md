# Design: phase-6-n8n-workflows

## Context

All services exist and are manually drivable:

- **scraper** (`:8001`): `POST /scrape/{slug}` (202, background run), `GET /runs`.
  No completion event is emitted — callers poll runs.
- **llm** (`:8002`): `POST /process/job` runs the full LangGraph chain
  (normalize → summarize/tags/red-flags → match → cover letter when score
  clears the threshold) and **returns** the results; it records
  `llm.pipeline_runs` but does not persist `core.jobs` / `core.job_matches` /
  `core.cover_letters`. There is no standalone cover-letter endpoint.
- **api gateway** (`:4000`): full read/write surface for the dashboard
  (jobs, sources incl. `POST /sources/:slug/scrape` proxy + `GET /:slug/runs`,
  reactions, profiles, cover-letters GET/PUT, llm-admin). OpenAPI → generated
  TS client in `packages/shared-ts`.
- **n8n**: existing container at `:5678`. `.env` already reserves
  `N8N_BASE_URL`, `N8N_WEBHOOK_NEW_MATCHES`, `TELEGRAM_*`, `SMTP_*`,
  `DIGEST_TO_EMAIL`, and `SERVICE_TOKEN` (shared secret for n8n→service calls).
- **DB**: `core.notifications` (unique `(job_match_id, channel)`,
  channel ∈ telegram|email) and `core.app_settings.match_threshold = 70`
  already exist (migration 0003).

Architecture §7 fixes the split: n8n owns cron, whole-run retries and
notification delivery; workflows contain **no business logic** (triggers +
HTTP calls + message formatting only) and are exported to
`n8n/workflows/*.json`.

## Goals / Non-Goals

**Goals:**

- Unattended pipeline: cron scrape → LLM processing → persisted matches →
  Telegram push and daily email digest.
- All decision logic (what to process, what was already notified, digest
  content) lives behind gateway endpoints; n8n only orchestrates.
- Workflows importable from versioned JSON on a fresh n8n instance.
- Close the Phase 5 deferral: functional cover-letter regeneration.

**Non-Goals:**

- Redis/arq queue handoff between scraper and llm (architecture mentions it;
  polling via the gateway is sufficient at this scale — revisit in Phase 7).
- crawl4ai / agent-browser adapters (Phase 2 leftover, separate change).
- Multi-recipient or per-user notification routing (single
  `TELEGRAM_CHAT_ID` / `DIGEST_TO_EMAIL`).
- n8n HA, queue mode, or self-hosted-worker tuning.

## Decisions

### D0 — The gateway calls scraper HTTP endpoints for `jobs_raw`, never SQL

Discovered during implementation: `scraper.jobs_raw` is owned by the scraper
service (docs/ARCHITECTURE.md §3 explicitly forbids direct cross-service DB
access). The automation feed and the processed/failed marking therefore go
through two new scraper endpoints (`GET /jobs_raw/unprocessed`,
`POST /jobs_raw/{id}/mark`) called from the gateway's `ScraperClient`, exactly
like the existing `triggerScrape`. Also discovered: `jobs_raw` never persisted
the listing title (only `raw_html`), even though the scraper already has it on
`JobLead.title` at fetch time — added a `title` column and threaded it through
`insert_raw` so the feed can satisfy `POST /process/job`'s required `title`
field without re-parsing `raw_html`.

### D1 — Gateway is the single writer for `core.*`; llm stays compute-only

The processing chain persists results through a new gateway endpoint rather
than having the llm service write `core.jobs`/`job_matches`/`cover_letters`
directly (the ARCHITECTURE.md data-flow sketch implied llm persistence, but
the implemented llm service is compute-only and schema ownership says `core.*`
belongs to the gateway). Alternative — teach llm to persist — rejected: it
duplicates repository code that already exists in NestJS and blurs schema
ownership.

### D2 — Poll-based chain, driven by an unprocessed-jobs feed

n8n does not need scrape-completion webhooks. The processing workflow runs on
its own schedule (and as a follow-up call after the scrape workflow):

1. `GET /v1/automation/jobs/unprocessed?limit=N` — gateway returns raw jobs
   (`jobs_raw` joined against processing state) that have no persisted LLM
   results, plus the active profile payload.
2. For each item, n8n calls llm `POST /process/job` (continue-on-fail).
3. `POST /v1/automation/jobs/{id}/results` — gateway persists normalized job,
   match and cover letter transactionally and marks the raw job processed.

Idempotency: step 3 is an upsert keyed on the raw-job id; re-running the
workflow after a partial failure re-processes only jobs still in the feed.
Alternative — llm webhook → n8n (`N8N_WEBHOOK_NEW_MATCHES`) — kept as the
_notification_ trigger name only; completion webhooks from background scrape
tasks would need new scraper plumbing for no added reliability over polling.

### D3 — One scheduler workflow, per-source cadence as data

A single `scrape-scheduler` workflow fires on a base cron (default: hourly),
calls `GET /v1/sources`, filters `enabled`, and honors an optional
per-source `config.cron` hint by skipping sources not yet due (n8n expression
against `last_run_at` from the sources payload — comparison only, no business
logic). Alternative — one workflow per source — rejected: five near-identical
workflows to keep in sync, and adding a source would require an n8n edit.

### D4 — Notification dedup enforced by the DB, exposed via the gateway

- `GET /v1/automation/matches/unnotified?channel=telegram` — matches with
  `score >= app_settings.match_threshold` lacking a `core.notifications` row
  for that channel (threshold resolved server-side).
- After a successful send, n8n calls
  `POST /v1/automation/notifications { jobMatchId, channel }`; the unique
  `(job_match_id, channel)` constraint makes double-sends impossible even if
  two workflow executions race — the second insert 409s and n8n treats it as
  already-sent.

### D5 — Digest is a gateway query + app_settings watermark

`GET /v1/automation/digest` returns jobs/matches first seen since
`app_settings.last_digest_at` (fallback: last 24 h). After sending, n8n calls
`POST /v1/automation/digest/sent` which advances the watermark. Email
formatting (subject, HTML table) lives in the n8n workflow — presentation,
not business logic.

### D6 — Service-token guard

All `/v1/automation/*` endpoints require `X-Internal-Token: ${INTERNAL_API_TOKEN}`
(NestJS guard, constant-time compare) — reusing the token/header already
validated in `api-config.schema.ts` and sent by the gateway's own outbound
HTTP clients, rather than introducing a second shared secret. They are
excluded from the dashboard's public surface but stay in the OpenAPI spec
(tagged `automation`) so the generated client and schemathesis cover them.
Alternative — full auth story — out of scope; the gateway is not
internet-exposed.

### D7 — Cover-letter regeneration: new llm endpoint + gateway proxy

llm gains `POST /cover-letter` (input: `job_id` + normalized job + profile —
the existing `cover_letter_prompt` only consumes job+profile, not
summary/match — output: draft) — the existing graph node exposed as a single
pipeline call, mirroring `POST /match`. Gateway adds
`POST /v1/jobs/:id/cover-letter/regenerate`: loads the stored job context,
calls llm, persists the new draft (versioned append in `cover_letters`,
consistent with the existing PUT), returns it. Web flips the Phase 5 disabled
"Regenerate" button to call the new endpoint with a loading state.
Alternative — reuse `/process/job` — rejected: re-runs the whole chain
(slow, re-scores the match as a side effect).

### D8 — Workflow authoring & validation approach

No interactive n8n UI session was available to build these workflows by
hand and export them. Instead: hand-authored minimal, portable workflow
JSON (nodes + connections + settings only, no instance-specific metadata),
then schema-validated each file for real against the user's running n8n
2.18.7 container via `n8n import:workflow --input=<file>` — all four
imported successfully (inactive, no credentials attached). Node
`typeVersion`s were taken from that same instance's `n8n export:nodes`
dump (e.g. `httpRequest` 4.4, `scheduleTrigger` 1.3, `code` 2) rather than
guessed, and two workflows were round-tripped via `export:workflow` to
confirm credential-by-name references and multi-output error branches
survive import unchanged. Files: `scrape-scheduler.json`,
`processing-chain.json`, `telegram-notifications.json`, `email-digest.json`
in `n8n/workflows/`, plus `n8n/README.md` documenting import, required env
vars (`JOB_HUNTER_API_BASE_URL`, `JOB_HUNTER_LLM_BASE_URL`,
`TELEGRAM_CHAT_ID`, `SMTP_USER`, `DIGEST_TO_EMAIL`) and credentials
(Header Auth, Telegram API, SMTP — referenced by name, never exported).
Live end-to-end execution (task 6.6) was attempted but blocked by a
pre-existing, unrelated environment issue (see below) and is left as an
operator step once real credentials exist.

### D0b — Fixed a pre-existing scrape-trigger bug (`runId` never returned)

`POST /scrape/{slug}` returned `{"status": "accepted", "source": slug}` —
never `runId` — because `run_scrape` created the `scrape_runs` row _inside_
the backgrounded coroutine, after the response was already sent. The
gateway's `HttpScraperClient.triggerScrape` has always assumed a `runId` in
the body (`BigInt(body['runId'])`), so this call has been silently broken
against a real scraper since Phase 4 (only caught now because the
scrape-scheduling capability's smoke test — task 6.6 — actually exercises
it; existing tests all use fakes that never touch the real JSON shape).
Fixed at the root: the scraper now creates the run row synchronously in the
handler and passes `run_id` into `run_scrape`, so the 202 response carries a
real id. No contract change for the gateway or web — they already expected
this shape; it's now genuinely satisfied.

## Risks / Trade-offs

- [Hourly polling adds latency between scrape and notification] → acceptable
  for job hunting; cadence is an n8n setting, tightening it is a UI tweak.
- [LLM processing of a large backlog in one run (timeouts, provider rate
  limits)] → feed is `limit`-capped (default 20/run); loop uses
  continue-on-fail so one bad job doesn't kill the batch; failures stay in
  the feed for the next run. A poison job could recycle forever → results
  endpoint also accepts a `failed` status to mark-and-skip after N attempts
  (attempt count kept on the raw-job row).
- [n8n export drift vs. what runs in the container] → README documents
  re-export as part of any workflow edit; PROGRESS task checks exports are
  current before closing the phase.
- [Secrets leaking into exported JSON] → credentials by name only; digest/
  telegram targets come from n8n env expressions, verified in review.
- [SERVICE_TOKEN is a single shared secret] → documented limitation;
  rotation = env change + n8n credential update.
- [Discovered, out of scope] `services/scraper` fails to start natively on
  Windows: psycopg's async pool requires a selector event loop, but
  `uvicorn`'s default on Windows is `ProactorEventLoop`
  (`PoolTimeout: pool initialization incomplete`). Pre-existing, unrelated to
  Phase 6 — blocked an attempted live end-to-end smoke test of
  `scrape-scheduler` (task 6.6). Likely fine under the project's normal dev
  workflow (WSL/Docker); flagged here rather than fixed, since it's outside
  this change's scope.

## Migration Plan

1. Ship gateway automation module + llm cover-letter endpoint (deployable
   before any n8n change; endpoints are inert until called).
2. DB migration 0005: processing marker (`jobs_raw.processed_at`,
   `jobs_raw.process_attempts`) + `app_settings.last_digest_at` seed row.
3. Build workflows in the n8n UI against local services; export to
   `n8n/workflows/`; commit.
4. Enable web Regenerate button (needs regenerated shared-ts client).
5. Rollback: deactivate workflows in n8n (no code path depends on them);
   gateway endpoints are additive.

## Open Questions

- Per-source cadence defaults (`config.cron`) — start with hourly for boards,
  4-hourly for Reddit/Upwork? Tunable in seed data, not blocking.
- Digest send time (default 08:00 local) — confirm with user at apply time.
