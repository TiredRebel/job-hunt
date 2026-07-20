# n8n workflows

Four workflows automate the job-hunter pipeline end to end: scrape → process
→ notify → digest. They contain **no business logic** — decisions (what to
process, dedup, thresholds, digest content) live behind the gateway's
`/v1/automation/*` endpoints (see `docs/ARCHITECTURE.md` §7 and
`openspec/changes/archive/*-phase-6-n8n-workflows/design.md`). Workflows only
schedule, call HTTP endpoints, and format messages.

| File                          | Trigger      | What it does                                                                                                                                                                                                    |
| ----------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scrape-scheduler.json`       | hourly       | `GET /v1/sources` → filter enabled + due (4-hourly sources skip 3/4 ticks) → `POST /v1/sources/{slug}/scrape`                                                                                                   |
| `processing-chain.json`       | every 15 min | `GET /v1/automation/jobs/unprocessed` → per job, `POST /process/job` on the LLM service → `POST /v1/automation/jobs/{id}/results` (processed or failed)                                                         |
| `telegram-notifications.json` | every 15 min | `GET /v1/automation/settings` → gate on `telegramEnabled` → `GET /v1/automation/matches/unnotified?channel=telegram` → Telegram message per match (chat id from settings) → `POST /v1/automation/notifications` |
| `email-digest.json`           | daily 08:00  | `GET /v1/automation/settings` → gate on `emailEnabled` → `GET /v1/automation/digest` → HTML email via SMTP (recipient from settings) → `POST /v1/automation/digest/sent` (only on send success)                 |

## Import

These files were authored and schema-validated against a running n8n 2.18.7
instance (`n8n import:workflow --input=<file>` succeeded for all four; see
the OpenSpec change's tasks.md for details) but were **not activated** and
carry no real credentials.

1. In the n8n UI: **Workflows → Import from File**, pick each of the four
   JSON files (or use the CLI: `n8n import:workflow --separate --input=n8n/workflows/`).
2. Each workflow imports **inactive**. Leave it that way until credentials
   and environment variables (below) are configured — an active workflow
   with a missing credential fails loudly on every scheduled tick.
3. Re-running the import with the same file updates the existing workflow
   (ids are fixed: `jh-scrape-scheduler`, `jh-processing-chain`,
   `jh-telegram-notifications`, `jh-email-digest`) rather than duplicating it.

## Required environment variables (on the n8n container/host)

n8n runs in its own container, separate from the gateway/LLM services, so it
needs its own reachable URLs — not `localhost` (which would resolve inside
the n8n container itself). On Docker Desktop, the host is reachable as
`host.docker.internal`.

| Variable                  | Example                               | Used by                    |
| ------------------------- | ------------------------------------- | -------------------------- |
| `JOB_HUNTER_API_BASE_URL` | `http://host.docker.internal:4000/v1` | all four workflows         |
| `JOB_HUNTER_LLM_BASE_URL` | `http://host.docker.internal:8002`    | processing-chain           |
| `SMTP_USER`               | (from `.env`)                         | email-digest (`fromEmail`) |

Set these on however the n8n container's environment is managed, then
restart n8n so it picks them up.

**`TELEGRAM_CHAT_ID` and `DIGEST_TO_EMAIL` are no longer read from n8n's
environment** (notification-settings-and-board-reorder change). Both
workflows now open with `GET /v1/automation/settings` (internal-token
gated), gate on `telegramEnabled` / `emailEnabled`, and take the destination
(`telegramChatId` / `toEmail`) from that response — edited in the dashboard
under Profile → Notifications, not in n8n's env. `fromEmail` stays
env-derived (`SMTP_USER`) since the settings response deliberately carries
no email-account identity, only the destination. If a channel is disabled
in the dashboard, the workflow's IF node stops the run right after the
settings fetch — no downstream HTTP calls, no send attempt.

**Known limitation:** `digestHour` (in the same settings response, also
editable in the dashboard) does not move `email-digest`'s Schedule Trigger —
the cron expression (`0 8 * * *`) is static in the workflow JSON. Changing
the hour in the UI updates what the gateway reports but not when n8n
actually fires; keep them in sync manually, or re-export the workflow with
an edited cron expression if you change the digest hour for real. Making
this dynamic (e.g. a polling trigger instead of a schedule trigger) is a
separate change.

## Required credentials (create once in the n8n UI, referenced by name only)

The exported JSON references credentials **by name only** — no tokens,
passwords, or chat ids are stored in the repo. Create these three in
**Credentials** before activating the workflows:

1. **"Job Hunter Internal Token"** — type _Header Auth_. Name: `X-Internal-Token`.
   Value: the same secret as the repo's `.env` → `INTERNAL_API_TOKEN`. Used by
   every call to `/v1/automation/*` (scrape-scheduler's calls to
   `/v1/sources*` are public dashboard endpoints and need no credential).
2. **"Job Hunter Telegram Bot"** — type _Telegram API_. Access token from
   `@BotFather` (matches `.env` → `TELEGRAM_BOT_TOKEN`).
3. **"Job Hunter SMTP"** — type _SMTP_. Host/port/user/password matching
   `.env` → `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`.

## Cadences

- `scrape-scheduler`: hourly base tick. Sources with `config.cron` containing
  `*/4` (reddit, upwork — seeded in `infra/db/seed.sql`) only trigger when
  the UTC hour is a multiple of 4. This is a deliberate simplification (plain
  hour-modulo arithmetic, no cron-parser dependency in n8n's Code node) — see
  design.md D3.
- `processing-chain` / `telegram-notifications`: every 15 minutes.
- `email-digest`: daily at 08:00 (server time).

Adjust any cadence by editing the Schedule Trigger node's cron expression,
then re-export (see below).

## Re-export after editing in the UI

If you adjust a workflow in the n8n UI, re-export it so the repo stays the
canonical source:

```bash
n8n export:workflow --id=jh-scrape-scheduler --pretty --output=n8n/workflows/scrape-scheduler.json
# ...repeat per workflow, or use --all --separate for all at once
```

Before committing, check the diff doesn't introduce credential ids, personal
project metadata, or timestamps — strip `shared`, `versionId`,
`activeVersionId`, `versionCounter`, `triggerCount`, `createdAt`, `updatedAt`,
and `meta` if your n8n version's export includes them; the versions in this
repo intentionally omit that instance-specific noise.

## Verifying end to end

Once credentials and env vars are set:

1. Activate `scrape-scheduler`, then manually execute it once (▶ in the UI,
   or `n8n execute --id=jh-scrape-scheduler`) — confirm a scrape run starts
   (`GET /v1/sources/{slug}/runs`).
2. Activate `processing-chain`; after a scrape completes, confirm jobs pick
   up a score in the dashboard.
3. In the dashboard (Profile → Notifications), enable Telegram and set a
   chat id, then activate `telegram-notifications`; confirm a message
   arrives for a job scoring at or above `app_settings.match_threshold`.
   With the channel left disabled, the run should stop right after the
   `Telegram Enabled?` node with no message sent — check the execution log.
4. Enable Email and set a recipient in the same dashboard section, then
   activate `email-digest`; confirm the daily email arrives and
   `app_settings.last_digest_at` advances (check via the profile/settings
   API or a direct query).
