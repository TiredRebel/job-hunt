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
| api_key_env             | text        | **env var name**, never the key itself            |
| pipeline_overrides      | jsonb       | `{ "match": {"model": "..."}, ... }`              |
| is_active               | boolean     | exactly one active (partial unique index)         |
| params                  | jsonb       | temperature, num_ctx, timeouts                    |
| created_at / updated_at | timestamptz |                                                   |

### core.keyword_dictionaries (editable from dashboard)

| column                  | type                 | notes                                                                         |
| ----------------------- | -------------------- | ----------------------------------------------------------------------------- |
| id                      | serial PK            |                                                                               |
| slug                    | text UNIQUE          | e.g. `search-terms`, `stop-words`, `must-have`, `nice-to-have`, `tag-aliases` |
| name                    | text                 | display name                                                                  |
| kind                    | text                 | `search` (drives scraper queries) / `include` / `exclude` / `alias`           |
| items                   | jsonb                | `["python", "fastapi", ...]` or `{ "js": "javascript", ... }` for aliases     |
| applies_to              | text[]               | source slugs it applies to, empty = all                                       |
| enabled                 | boolean default true |                                                                               |
| created_at / updated_at | timestamptz          |                                                                               |

Consumers: **scraper** builds source search queries from `kind='search'` dictionaries; **llm** matcher receives `include`/`exclude` lists as hard filters before scoring; `exclude` hits set `core.jobs.status='hidden'`. Changes take effect on the next run (dictionaries are read per-run, no caching).

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

Key–value (`key text PK, value jsonb`): match threshold, digest hour, notification toggles.

### core.notifications

| column                         | type         | notes                    |
| ------------------------------ | ------------ | ------------------------ |
| id                             | bigserial PK |                          |
| job_match_id                   | FK           |                          |
| channel                        | text         | `telegram` / `email`     |
| sent_at                        | timestamptz  |                          |
| UNIQUE (job_match_id, channel) |              | idempotent sends for n8n |

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
