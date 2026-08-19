# Data Model (Postgres 17, database `jobhunter`)

Schemas: `core` (shared domain), `scraper` (owned by scraper service), `llm` (owned by llm service).
Migrations: plain SQL via dbmate in `infra/db/migrations/`.

## core

### core.sources

| column                  | type                 | notes                                               |
| ----------------------- | -------------------- | --------------------------------------------------- |
| id                      | smallserial PK       |                                                     |
| slug                    | text UNIQUE          | `dou`, `workua`, `jobua`, `upwork`, `reddit`        |
| name                    | text                 | display name                                        |
| base_url                | text                 |                                                     |
| enabled                 | boolean default true | toggled from dashboard                              |
| fetch_strategy          | text                 | `api` / `crawl4ai` / `agent-browser`                |
| config                  | jsonb                | per-source: search queries, subreddits, rate limits |
| created_at / updated_at | timestamptz          |                                                     |

#### Source deletion semantics

`DELETE /v1/sources/{slug}` permanently removes the `core.sources` row, but
only when it has zero associated `core.jobs`, `scraper.jobs_raw`, or
`scraper.scrape_runs` rows — all three have a `NOT NULL REFERENCES
core.sources(id)` foreign key with no `ON DELETE` cascade, so a source that
has ever been scraped is rejected with `409` rather than cascading into
vacancy/scrape history (a much larger, unrequested deletion). The guard is a
single `DELETE ... WHERE slug = $1 AND NOT EXISTS(...) AND NOT EXISTS(...)
AND NOT EXISTS(...) RETURNING id`, race-safe by construction. A source with
real history stays removable only by disabling it (`enabled = false`). The
operation returns `{ "deleted": true }` on success, `404` when the slug is
unknown, or `409` (message names the slug) when blocked.

### core.jobs (normalized, LLM-extracted)

| column                          | type                  | notes                               |
| ------------------------------- | --------------------- | ----------------------------------- |
| id                              | bigserial PK          |                                     |
| source_id                       | FK → core.sources     |                                     |
| raw_id                          | FK → scraper.jobs_raw | provenance                          |
| external_id                     | text                  | id/url slug on the source site      |
| url                             | text                  | canonical posting URL               |
| title                           | text                  |                                     |
| company                         | text                  |                                     |
| description_md                  | text                  | cleaned markdown                    |
| summary                         | text                  | LLM summary                         |
| tags                            | text[]                | tech stack tags                     |
| red_flags                       | text[]                | LLM-detected warnings               |
| salary_min / salary_max         | integer               | nullable                            |
| salary_currency                 | text                  | ISO 4217, nullable                  |
| seniority                       | text                  | `junior/middle/senior/lead/unknown` |
| remote                          | text                  | `remote/hybrid/office/unknown`      |
| location                        | text                  | nullable                            |
| posted_at                       | timestamptz           | from source, nullable               |
| first_seen_at / last_seen_at    | timestamptz           | watermark for incremental scrape    |
| content_hash                    | text                  | dedup fingerprint                   |
| status                          | text                  | `new/processed/archived/hidden`     |
| UNIQUE (source_id, external_id) |                       |                                     |

#### Job deletion semantics

`DELETE /v1/jobs/{id}` permanently removes only the normalized `core.jobs`
row. Foreign keys cascade removal of `job_matches`, `cover_letters`,
`job_reactions`, and `job_board_position`; notification pipeline references
are set to `NULL`. The referenced `scraper.jobs_raw` row and scrape-run
history are intentionally retained, so raw provenance remains available for
audit and reprocessing. The operation is irreversible and returns
`{ "deleted": true }` on success, or `404` when the normalized job is absent.

### core.profiles

| column                  | type        | notes                                                    |
| ----------------------- | ----------- | -------------------------------------------------------- |
| id                      | serial PK   |                                                          |
| name                    | text        | e.g. "default"                                           |
| cv_md                   | text        | CV / resume in markdown                                  |
| skills                  | text[]      |                                                          |
| preferences             | jsonb       | desired salary, remote, stop-words, locations, seniority |
| is_active               | boolean     | one active profile at a time                             |
| created_at / updated_at | timestamptz |                                                          |

### core.job_matches

| column                      | type               | notes                   |
| --------------------------- | ------------------ | ----------------------- |
| id                          | bigserial PK       |                         |
| job_id                      | FK → core.jobs     |                         |
| profile_id                  | FK → core.profiles |                         |
| score                       | smallint           | 0–100                   |
| explanation                 | text               | LLM rationale           |
| model_used                  | text               | provider/model snapshot |
| created_at                  | timestamptz        |                         |
| UNIQUE (job_id, profile_id) |                    | re-match overwrites     |

### core.cover_letters

| column                      | type                  | notes                                                          |
| --------------------------- | --------------------- | -------------------------------------------------------------- |
| id                          | bigserial PK          |                                                                |
| job_id                      | FK → core.jobs        |                                                                |
| profile_id                  | FK → core.profiles    |                                                                |
| body_md                     | text                  | draft only — user sends manually                               |
| model_used                  | text                  |                                                                |
| edited                      | boolean default false | set once the user saves an edit via the dashboard              |
| created_at / updated_at     | timestamptz           |                                                                |
| UNIQUE (job_id, profile_id) |                       | one draft per job/profile pair; dashboard edits upsert onto it |

### core.llm_providers

| column                  | type        | notes                                             |
| ----------------------- | ----------- | ------------------------------------------------- |
| id                      | serial PK   |                                                   |
| slug                    | text UNIQUE | `ollama-local`, `ollama-cloud`, `openrouter`, ... |
| kind                    | text        | `ollama` / `openai-compatible` / `anthropic`      |
| base_url                | text        | e.g. `http://localhost:11434`                     |
| default_model           | text        | e.g. `qwen3:14b`                                  |
| api_key_ciphertext      | text        | Fernet-encrypted API key; never exposed via API   |
| pipeline_overrides      | jsonb       | `{ "match": {"model": "..."}, ... }`              |
| is_active               | boolean     | exactly one active (partial unique index)         |
| params                  | jsonb       | temperature, num_ctx, timeouts                    |
| created_at / updated_at | timestamptz |                                                   |

### core.keyword_dictionaries (editable from dashboard)

| column                  | type                 | notes                                                                                    |
| ----------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| id                      | serial PK            |                                                                                          |
| slug                    | text UNIQUE          | e.g. `search-terms`, `stop-words`, `must-have`, `nice-to-have`, `tag-aliases`            |
| name                    | text                 | display name                                                                             |
| kind                    | text                 | `search` (drives scraper queries) / `include` / `exclude` / `exclude_employer` / `alias` |
| items                   | jsonb                | `["python", "fastapi", ...]` or `{ "js": "javascript", ... }` for aliases                |
| applies_to              | text[]               | source slugs it applies to, empty = all                                                  |
| enabled                 | boolean default true |                                                                                          |
| created_at / updated_at | timestamptz          |                                                                                          |

Consumers: **scraper** builds source search queries from `kind='search'` dictionaries and skips listing-page leads whose company matches an enabled `exclude_employer` dictionary (case-insensitive); **automation** applies `exclude`, `exclude_employer`, and enabled `must-have` (`include` slug only) as hard filters when persisting processed jobs — matches set `core.jobs.status='hidden'`. Changes take effect on the next run (dictionaries are read per-run, no caching).

### core.job_reactions (event log — application/response tracking per vacancy)

| column      | type               | notes                                                                                                                            |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| id          | bigserial PK       |                                                                                                                                  |
| job_id      | FK → core.jobs     |                                                                                                                                  |
| profile_id  | FK → core.profiles |                                                                                                                                  |
| reaction    | text               | `saved` / `applied` / `viewed_by_employer` / `replied` / `interview` / `test_task` / `offer` / `rejected` / `withdrawn` / `note` |
| note        | text               | free-form comment, nullable                                                                                                      |
| occurred_at | timestamptz        | user-editable (backdating allowed)                                                                                               |
| created_at  | timestamptz        |                                                                                                                                  |

Append-only history; the **latest non-`note` reaction** is the job's current stage. Bulk operations (e.g. mark several vacancies `applied`) insert one row per job. Read model:

```sql
CREATE VIEW core.job_reaction_current AS
SELECT DISTINCT ON (job_id, profile_id) job_id, profile_id, reaction, occurred_at
FROM core.job_reactions WHERE reaction <> 'note'
ORDER BY job_id, profile_id, occurred_at DESC, id DESC;
```

### core.app_settings

Key–value (`key text PK, value jsonb`): match threshold, digest hour. The
`notifications` key was removed by migration `0008` (moved to
`core.notification_settings` below) — `app_settings` is no longer a second
source of truth for notification config.

### core.notifications

| column                         | type         | notes                    |
| ------------------------------ | ------------ | ------------------------ |
| id                             | bigserial PK |                          |
| job_match_id                   | FK           |                          |
| channel                        | text         | `telegram` / `email`     |
| sent_at                        | timestamptz  |                          |
| UNIQUE (job_match_id, channel) |              | idempotent sends for n8n |

### core.notification_settings (singleton, dashboard-editable)

| column                 | type           | notes                                                                             |
| ---------------------- | -------------- | --------------------------------------------------------------------------------- |
| id                     | integer PK     | `DEFAULT 1 CHECK (id = 1)` — enforces a single row                                |
| telegram_enabled       | boolean        | default `false`                                                                   |
| telegram_chat_id       | text           | nullable — destination, editable in the dashboard                                 |
| telegram_bot_token_env | text           | default `'TELEGRAM_BOT_TOKEN'` — the **name** of an env var, never a secret value |
| email_enabled          | boolean        | default `false`                                                                   |
| smtp_host / smtp_port  | text / integer | nullable, `smtp_port` constrained `1–65535`                                       |
| smtp_user              | text           | nullable                                                                          |
| smtp_password_env      | text           | default `'SMTP_PASSWORD'` — env-var name, never a secret value                    |
| from_email / to_email  | text           | nullable — `to_email` is the digest/notification destination                      |
| updated_at             | timestamptz    |                                                                                   |

Secrets (bot token, SMTP password) are **never stored here** — only the name
of the environment variable that holds them. The gateway resolves
`process.env[<stored name>]` at request time to compute presence booleans
(`botTokenConfigured` / `smtpPasswordConfigured` on `GET
/v1/settings/notifications`) — the secret value itself is never read into a
response. `match_threshold` and `digest_hour` remain in `core.app_settings`;
the settings API composes both sources into one response, but the storage
split stays below that API layer. n8n reads the effective config (enabled +
destination only, no secrets, no env-var names) via `GET
/v1/automation/settings` — see `n8n/README.md`.

### core.job_board_position (advisory manual card order)

| column     | type               | notes                                                            |
| ---------- | ------------------ | ---------------------------------------------------------------- |
| profile_id | FK → core.profiles | part of PK                                                       |
| job_id     | FK → core.jobs     | part of PK — `PRIMARY KEY (profile_id, job_id)`                  |
| stage      | text               | **advisory only** — see below, not used to filter or join        |
| position   | integer            | manual order within a column, rewritten in full on every reorder |
| updated_at | timestamptz        |                                                                  |

Index: `(profile_id, stage, position)`.

The `stage` column is advisory-only: the board's actual stage per job comes
from `core.job_reaction_current` (the reaction event log), same as before
this table existed. `job_board_position` only ever supplies an `ORDER BY`
tiebreaker (`bp.position ASC NULLS LAST`, joined in the jobs list query when
`sortBy=board`) — a job's row here can transiently disagree with its real
current stage (e.g. right after a cross-column drag moves the reaction but
the destination-column position write hasn't landed yet) without causing
any incorrect stage read, because nothing filters on `bp.stage`. A full
column reorder (which the UI always sends — never a partial list) rewrites
every row for that profile+stage in one statement
(`unnest(...) WITH ORDINALITY` + `ON CONFLICT ... DO UPDATE`), so a stale
position self-heals on the next reorder rather than needing a repair job.

## scraper

### scraper.scrape_runs

| column                   | type              | notes                            |
| ------------------------ | ----------------- | -------------------------------- |
| id                       | bigserial PK      |                                  |
| source_id                | FK → core.sources |                                  |
| started_at / finished_at | timestamptz       |                                  |
| status                   | text              | `running/success/partial/failed` |
| stats                    | jsonb             | found / new / updated / errors   |
| error                    | text              | nullable                         |

### scraper.jobs_raw

| column                                        | type                     | notes                        |
| --------------------------------------------- | ------------------------ | ---------------------------- |
| id                                            | bigserial PK             |                              |
| run_id                                        | FK → scraper.scrape_runs |                              |
| source_id                                     | FK → core.sources        |                              |
| external_id                                   | text                     |                              |
| url                                           | text                     |                              |
| raw_html                                      | text                     | or raw JSON for API sources  |
| fetched_at                                    | timestamptz              |                              |
| processing_status                             | text                     | `pending/queued/done/failed` |
| UNIQUE (source_id, external_id, content_hash) |                          |                              |

## llm

### llm.pipeline_runs

| column                 | type           | notes                              |
| ---------------------- | -------------- | ---------------------------------- |
| id                     | bigserial PK   |                                    |
| job_id                 | FK → core.jobs | nullable for ad-hoc runs           |
| pipeline               | text           | `normalize/tag/match/cover_letter` |
| provider_slug / model  | text           | snapshot                           |
| tokens_in / tokens_out | integer        | cost tracking                      |
| latency_ms             | integer        |                                    |
| status                 | text           | `success/failed`                   |
| error                  | text           |                                    |
| created_at             | timestamptz    |                                    |

## Indexes (beyond PKs/uniques)

- `core.jobs (status, last_seen_at desc)` — dashboard default view
- `core.jobs (posted_at desc)` and `core.jobs (first_seen_at desc)` — **date-interval filter/search** (`from`/`to` on either field)
- `core.jobs USING gin (tags)` — tag filtering
- `core.job_matches (score desc)` — top matches
- `core.job_reactions (job_id, profile_id, occurred_at desc)` — reaction timeline / current-stage view
- `scraper.jobs_raw (processing_status)` — queue sweeper

## Filtering contract (API level)

Jobs list endpoint accepts: `date_field=posted|first_seen`, `date_from`, `date_to` (ISO 8601, inclusive), combined freely with source, tags, score range, remote, seniority, salary, reaction stage, and full-text query (`websearch_to_tsquery` over title+company+description).
