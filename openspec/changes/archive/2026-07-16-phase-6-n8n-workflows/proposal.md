# Proposal: phase-6-n8n-workflows

## Why

Phases 0–5 delivered the services and dashboard, but nothing runs on its own:
scrapes must be triggered by hand, scraped jobs are never pushed through the
LLM pipeline, and no one is notified when a high-scoring match appears. Phase 6
adds the automation layer — n8n owns time-based triggers and notification
fan-out (per docs/ARCHITECTURE.md §7), turning the system into a hands-off job
hunter.

## What Changes

- **Scheduled scraping**: an n8n cron workflow triggers
  `POST /scrape/{slug}` on the scraper per enabled source, with per-source
  cadence read from source config.
- **Post-processing chain**: when a scrape run finishes, each new job is run
  through the LLM pipeline (`POST /process/job`) against the active profile and
  the results (normalized job, summary/tags, match score, cover letter for
  high scores) are persisted.
- **Gateway automation endpoints**: the NestJS API gains the small internal
  surface n8n needs — an unprocessed-jobs feed, a persist-processed-results
  endpoint, a notifications ledger (dedup via `core.notifications`), and a
  digest query. n8n workflows stay free of business logic (triggers + HTTP +
  formatting only).
- **Telegram notifications**: n8n pushes a Telegram message for new matches
  with score ≥ `app_settings.match_threshold`, at most once per match/channel.
- **Daily email digest**: n8n sends a daily email summarizing new jobs and
  matches since the previous digest.
- **Versioned workflows**: all n8n workflows are exported to
  `n8n/workflows/*.json` and committed.
- **Cover-letter regeneration** (deferred here from Phase 5): the gateway
  proxies a regenerate request to the LLM service so the dashboard's disabled
  "Regenerate" button can go live.

## Capabilities

### New Capabilities

- `scrape-scheduling`: cron-driven scrape triggering per enabled source with
  per-source cadence and failure handling.
- `processing-chain`: scrape-run completion → LLM processing → persisted
  matches/cover letters, idempotent per job.
- `automation-api`: gateway endpoints that back the n8n workflows
  (unprocessed-jobs feed, result ingest, notification ledger, digest query,
  service-token auth for n8n calls).
- `match-notifications`: Telegram push for above-threshold matches with
  once-per-match/channel dedup.
- `email-digest`: daily digest email of new jobs/matches.
- `workflow-versioning`: n8n workflows exported and versioned under
  `n8n/workflows/`.

### Modified Capabilities

- `job-detail`: the cover-letter requirement gains regeneration — the
  view/edit surface's "Regenerate" action becomes functional (gateway → LLM
  service), replacing the Phase 5 disabled-button placeholder.

## Impact

- **apps/api**: new automation module (internal endpoints + service-token
  guard), cover-letter regenerate proxy, notifications repository; OpenAPI +
  `packages/shared-ts` client regenerated.
- **services/llm**: dedicated cover-letter (re)generation endpoint if the full
  `/process/job` graph is too coarse; otherwise unchanged.
- **services/scraper**: two additions, both required by the schema-ownership
  rule in docs/ARCHITECTURE.md §3 (the gateway must never query `scraper.*`
  tables directly) — `GET /jobs_raw/unprocessed` and
  `POST /jobs_raw/{id}/mark` back the automation feed; `jobs_raw` also gains a
  `title` column (the scraper already knows the listing title via
  `JobLead.title` at fetch time but was discarding it) so the feed can supply
  `POST /process/job`'s required `title` field.
- **apps/web**: enable the existing Regenerate button (`job-detail`).
- **n8n (existing container :5678)**: four workflows + credentials
  (Telegram bot, SMTP); exports live in `n8n/workflows/*.json`.
- **DB**: `core.notifications` already exists (migration 0003); a
  `processed_at`/watermark marker for the unprocessed-jobs feed may be needed.
- **Config**: uses existing `.env` keys (`N8N_*`, `TELEGRAM_*`, `SMTP_*`,
  `DIGEST_TO_EMAIL`, `SERVICE_TOKEN`).
