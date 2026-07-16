# Tasks: phase-6-n8n-workflows

## 1. DB migration & config

- [x] 1.1 Migration 0006 (0005 was already taken by cover-letter-edited): add
      `jobs_raw.processed_at timestamptz` and
      `jobs_raw.process_attempts int NOT NULL DEFAULT 0`; seed
      `app_settings.last_digest_at`; applied to local `jobhunter` DB via
      `dbmate up`; schema.sql dumped
- [x] 1.2 Seed per-source cadence hints (`config.cron`, jsonb merge): hourly
      for dou/workua/jobua, every-4-hours for reddit/upwork
- [x] 1.3 `.env.example` already covers all Phase 6 keys (`N8N_*`,
      `TELEGRAM_*`, `SMTP_*`, `DIGEST_TO_EMAIL`); reused the existing
      `INTERNAL_API_TOKEN` / `X-Internal-Token` convention (already validated
      in `api-config.schema.ts`) for n8n→gateway auth instead of introducing
      a new `SERVICE_TOKEN` var

## 2. LLM service — cover-letter endpoint

- [x] 2.1 Add `POST /cover-letter` route (`job_id` + normalized job + profile
      → draft; the cover-letter prompt only needs job+profile, not
      summary/match) reusing the existing graph node like `POST /match`
- [x] 2.2 Unit tests for the new route (success, 503 no provider, 502 llm
      error); ruff + mypy --strict + pytest all green (30/30)

## 3. API gateway — automation module

- [x] 3.0 (discovered) scraper additions required by schema ownership:
      migration 0007 adds `scraper.jobs_raw.title`, threaded through
      `insert_raw`; new scraper endpoints `GET /jobs_raw/unprocessed` and
      `POST /jobs_raw/{id}/mark` (attempt-counter + terminal `failed` status
      via `max_process_attempts` setting, default 3); 5 new pytest cases,
      ruff/mypy/pytest all green (30/30)
- [x] 3.0b (discovered pre-existing bug, fixed) `POST /scrape/{slug}` never
      returned `runId` (`run_scrape` created the run row inside the
      backgrounded coroutine), so `HttpScraperClient.triggerScrape`'s
      `BigInt(body['runId'])` would throw against a real scraper — broke
      both the Phase 5 web "trigger scrape" button and the Phase 6
      scrape-scheduler. Fixed by creating the run row synchronously in the
      handler and threading `run_id` into `run_scrape`; gateway contract
      (`ScrapeTriggerResponse`, web's `ScrapeRunResponse`) unchanged, now
      actually satisfied. Scraper gates re-confirmed green.
- [x] 3.1 `AutomationModule` skeleton (Clean Architecture layout) +
      `InternalTokenGuard` (constant-time compare against
      `INTERNAL_API_TOKEN`, 401 on miss) wired to all automation routes
- [x] 3.2 `GET /v1/automation/jobs/unprocessed?limit=` — calls the scraper's
      new `GET /jobs_raw/unprocessed` (via `ScraperClient`, never direct SQL
      against `scraper.*`) joined with the active profile mapped to the LLM
      service's `ProfileInput` shape
- [x] 3.3 `POST /v1/automation/jobs/{rawJobId}/results` — transactional
      upsert of job/match/cover-letter in `core.*` (never overwrites an
      already-edited cover letter), then calls the scraper's
      `POST /jobs_raw/{id}/mark`; accepts `failed` status for poison jobs
      (attempt-counter lives in the scraper, see 3.0); idempotent re-post
- [x] 3.4 `GET /v1/automation/matches/unnotified?channel=` — threshold from
      `app_settings.match_threshold`, anti-join on `core.notifications`
- [x] 3.5 `POST /v1/automation/notifications` — insert ledger row, 409 on
      duplicate `(job_match_id, channel)`
- [x] 3.6 `GET /v1/automation/digest` + `POST /v1/automation/digest/sent` —
      window from `app_settings.last_digest_at` (24 h fallback), watermark
      advance
- [x] 3.7 Response/request DTOs with `@ApiProperty`/`@ApiBody`, `automation`
      OpenAPI tag (6 paths confirmed via `openapi:emit`); unit tests with
      in-memory fakes for every endpoint incl. guard 401 paths — 19 new
      vitest cases (automation.service.spec 14 + guard spec 5), full suite
      73/73, typecheck/lint clean

## 4. API gateway — cover-letter regenerate proxy

- [x] 4.1 `POST /v1/jobs/:jobId/cover-letter/regenerate` — new
      `LlmCoverLetterClient` port/HTTP client, reuses existing
      `JobRepository.findById` (already joins `job_matches` for
      matchScore/matchExplanation, no new repository needed); persists via
      new `CoverLetterRepository.saveGenerated` (edited=false, never
      confused with user edits); 404 no job / no persisted match, 503 no
      active provider, 502 any other LLM failure
- [x] 4.2 Unit tests: happy path (incl. remote-enum→boolean + seniority
      mapping asserted), overwrites a previously-edited draft, no-job 404,
      no-match 404, no-active-profile 404, 503 mapping, 502 mapping — 7 new
      vitest cases (cover-letters.service.spec 5→12), full suite 80/80,
      typecheck/lint clean, OpenAPI confirms
      `POST /v1/jobs/{jobId}/cover-letter/regenerate`

## 5. Shared client & web

- [x] 5.1 Regenerate OpenAPI spec + `packages/shared-ts` client (fixed
      `@ApiOkResponse`→`@ApiCreatedResponse` mismatch on regenerate — NestJS
      POST defaults to 201); shared-ts typecheck/lint/build green
- [x] 5.2 Enabled the job-detail "Regenerate" button:
      `regenerateCoverLetter()` API function, mutation with loading label
      ("Regenerating…"), invalidates the cover-letter query on success
      (replaces editor content), error toast; button disabled + tooltip when
      `job.matchScore === null` (mirrors the backend's match requirement);
      `window.confirm` reused (same pattern as the drawer's close-guard) when
      regenerating over unsaved edits
- [x] 5.3 6 new vitest cases in `lib/api/cover-letters.spec.ts` (get/save/
      regenerate incl. 404 no-match and 503 no-provider propagation) — no
      React component-test harness exists in this repo (web tests cover
      `lib/*` only; component behavior is e2e's job), so regenerate is
      tested at the API-client layer, consistent with `client.spec.ts`. EN+UK
      strings added (`coverLetterRegenerating`,
      `coverLetterRegenerateNoMatchHint`, `coverLetterRegenerated`,
      `coverLetterRegenerateError`); stale `coverLetterRegenerateHint` retired.
      Web typecheck/lint/test(37/37)/build all green

## 6. n8n workflows

- [x] 6.1 No interactive n8n UI session available, so credentials/env are
      documented (not created) in `n8n/README.md`: Header Auth ("Job Hunter
      Internal Token"), Telegram API ("Job Hunter Telegram Bot"), SMTP ("Job
      Hunter SMTP") — values sourced from `.env`; plus 5 required n8n-side
      env vars (`JOB_HUNTER_API_BASE_URL`, `JOB_HUNTER_LLM_BASE_URL`,
      `TELEGRAM_CHAT_ID`, `SMTP_USER`, `DIGEST_TO_EMAIL`)
- [x] 6.2 `scrape-scheduler`: hourly cron → `GET /v1/sources` → Code node
      filters enabled + due (simple hour-modulo check against `config.cron`,
      not a full cron parser — see design D3) → `POST /v1/sources/{slug}
  /scrape` (`onError: continueRegularOutput` per source)
- [x] 6.3 `processing-chain`: cron every 15 min →
      `GET /v1/automation/jobs/unprocessed` → Code node pairs each job with
      the active profile → `POST /process/job` on the LLM service
      (`onError: continueErrorOutput`, two branches) → success branch maps
      the LLM response onto the results DTO and posts `status: processed`;
      error branch posts `status: failed`
- [x] 6.4 `telegram-notifications`: cron every 15 min →
      `GET /v1/automation/matches/unnotified?channel=telegram` → Code node
      formats the message → Telegram "Send Message" (`onError:
  continueRegularOutput`) → `POST /v1/automation/notifications`
      (non-2xx, incl. 409 already-sent, doesn't block the next tick)
- [x] 6.5 `email-digest`: daily 08:00 cron → `GET /v1/automation/digest` →
      Code node builds subject/HTML → SMTP send (no `onError` override —
      default stop-on-fail is exactly "don't advance the watermark on
      failure") → `POST /v1/automation/digest/sent`
- [x] 6.6 Schema-validated all four via real `n8n import:workflow` against
      the user's running n8n 2.18.7 instance (imported inactive, ids
      `jh-*`); attempted a live HTTP smoke test of scrape-scheduler by
      starting `apps/api` + `services/scraper` locally, but
      `services/scraper` fails to start natively on Windows (pre-existing
      psycopg/ProactorEventLoop incompatibility, unrelated to this change —
      see design.md risks); background dev servers stopped cleanly. Full
      live end-to-end (real Telegram/SMTP credentials, all services running)
      is left as an operator step per `n8n/README.md` "Verifying end to end"
      — no Telegram bot / SMTP credentials exist yet to run it against

## 7. Export, docs & gates

- [x] 7.1 All four workflows in `n8n/workflows/*.json` (credential
      references by name only — grepped for `token|password|secret|api_key`,
      clean) + `n8n/README.md` runbook (import, env vars, credentials,
      cadences, re-export rule, "verifying end to end")
- [x] 7.2 Full gates re-run clean in one pass: llm 30/30 pytest + ruff +
      ruff format + mypy --strict; scraper 30/30 + ruff + format + mypy
      --strict; api tsc + eslint + 80/80 vitest + `tsc -p tsconfig.build.json`;
      shared-ts tsc + eslint + build; web tsc + eslint + 37/37 vitest +
      `next build` (2 pre-existing TanStack Compiler warnings only, no errors)
- [x] 7.3 PROGRESS.md Phase 6 flipped to ✅ with a log entry; wiki
      `current-state.md` + `log.md` checkpointed; commit still pending
      (this task list itself, ready for the parent session to commit)
