# Installation, Configuration & Deployment

Step-by-step guide to bootstrap job-hunter from a clean machine, configure
every service, and run it in development or production. For the system
design behind these steps see [ARCHITECTURE.md](ARCHITECTURE.md); for the
LLM provider model see [LLM_CONFIG.md](LLM_CONFIG.md).

> **Current support level**: everything below is verified against the
> actual repo (scripts, configs, migrations, Docker builds, CI) — the four
> Dockerfiles and the CI workflow were built and test-run as part of writing
> this guide, not just described. A few remaining gaps are called out
> explicitly in [§9 Known gaps](#9-known-gaps--follow-ups) rather than
> papered over — read that section before you assume something works.

## 1. Prerequisites

| Dependency        | Minimum version   | Used by                                                                | Install                                                                                         |
| ----------------- | ----------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Node.js           | ≥ 22              | `apps/web`, `apps/api`, `packages/shared-ts`, tooling                  | [nodejs.org](https://nodejs.org) or a version manager (`nvm`, `fnm`)                            |
| npm               | bundled with Node | workspaces + turborepo                                                 | —                                                                                               |
| Python            | ≥ 3.13            | `services/scraper`, `services/llm`                                     | [python.org](https://www.python.org) — or let `uv` fetch it                                     |
| uv                | latest            | Python dependency management for both services                         | `pip install uv` or the [uv installer](https://docs.astral.sh/uv/getting-started/installation/) |
| Docker            | any recent        | Redis, Postgres (if not already running), n8n (if not already running) | [docker.com](https://www.docker.com/)                                                           |
| PostgreSQL        | 17                | system of record (`jobhunter` database)                                | via Docker (see §2) or a native install                                                         |
| n8n               | 2.x               | scheduling, Telegram bot, email digest                                 | via Docker (see §7)                                                                             |
| Ollama            | latest            | free local LLM provider (seed default)                                 | [ollama.com](https://ollama.com) — optional if you'll only use a cloud provider                 |
| agent-browser CLI | latest            | only if you enable the `agent-browser` fetch strategy (Upwork)         | `npm i -g agent-browser && agent-browser install` — optional, see §9                            |

This repo assumes Postgres and n8n may already exist as long-lived containers
on your machine (they did on the machine this was built on: `pg-learn` and an
`n8n` container). §2 and §7 give you the commands to create them fresh if
they don't.

## 2. Clone & install JS/TS dependencies

```bash
git clone <your-fork-or-remote-url> job-hunter
cd job-hunter
npm install          # installs all npm workspaces (apps/*, packages/*) via turborepo
```

This does **not** install the Python services — see §4.

## 3. Database

### 3.1 Get a Postgres 17 instance

If you already have a Postgres 17 container/instance reachable at
`localhost:5432`, skip to §3.2. Otherwise, create one:

```bash
docker network create job-hunter-database
docker run -d --name pg-learn \
  --restart unless-stopped \
  --network job-hunter-database \
  -e POSTGRES_PASSWORD=CHANGE_ME \
  -p 5432:5432 \
  -v pg-learn-data:/var/lib/postgresql/data \
  postgres:17
```

If `pg-learn` already exists, attach it once instead of recreating it:

```bash
docker network create job-hunter-database  # "already exists" is harmless
docker network connect job-hunter-database pg-learn
```

The application containers use Docker DNS (`pg-learn:5432`) on this external
network. They deliberately do not route database traffic through
`host.docker.internal`: that container-to-host-to-container path can fail after
a Docker Desktop/WSL networking change even while `localhost:5432` still works
from Windows.

> **Use a named volume, not a bind mount.** On 2026-07-19 the `jobhunter`
> database was lost when the live `pg-learn` container (bind-mounted to a
> WSL host path) came back from a Docker Desktop restart with a freshly
> `initdb`-ed empty cluster — the bind-mount source had silently stopped
> resolving to the old data (a known Docker Desktop/WSL2 file-sharing
> fragility, not a Postgres issue). Recreating the container on the named
> volume above and verifying data survives a full `docker rm` + recreate
> (not just a `restart`) closed the gap — see PROGRESS.md's 2026-07-19 entry
> for the recovery and the verification steps. `--restart unless-stopped`
> also avoids the container simply staying stopped after a host restart.

### 3.2 Create the `jobhunter` database

```bash
docker exec -it pg-learn psql -U postgres -c "CREATE DATABASE jobhunter;"
```

### 3.3 Configure `.env` for migrations

Copy the root env template and fill in the database password:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to match your Postgres instance, e.g.:

```
DATABASE_URL=postgres://postgres:CHANGE_ME@localhost:5432/jobhunter?sslmode=disable
```

`dbmate` (used by the `db:*` npm scripts) needs two additional variables that
are **not** in `.env.example` — add them yourself, or copy them from below.
Without these, `dbmate` looks for migrations under `./db/migrations` instead
of this repo's actual `infra/db/migrations`:

```
DBMATE_MIGRATIONS_DIR=./infra/db/migrations
DBMATE_SCHEMA_FILE=./infra/db/schema.sql
```

(These two lines have been added to `.env.example` as part of this guide, so
a fresh `cp .env.example .env` now carries them forward.)

### 3.4 Run migrations and seed data

```bash
npm run db:up      # applies infra/db/migrations/0001..0007 — creates schemas core/scraper/llm
npm run db:seed    # idempotent: 5 sources, default profile, default Ollama provider, starter dictionaries
npm run db:status  # sanity check — all 7 migrations should show as applied
```

The seed inserts:

- 5 sources (`dou`, `workua`, `jobua` via crawl4ai; `reddit` via API; `upwork` via agent-browser, disabled by default)
- one active default profile (empty CV/skills — fill in via the dashboard's Profile page)
- one active LLM provider row: `ollama-local` (`http://localhost:11434`, model `qwen3:14b`, per-pipeline overrides using `qwen3:8b`/`qwen3:14b`/`qwen3:32b`)
- starter keyword dictionaries (search terms, stop-words, nice-to-have, tag aliases)
- `app_settings`: `match_threshold=70`, `digest_hour=9`

## 4. Configure and install the Python services

Each service is uv-managed and independent.

```bash
cd services/llm
uv sync
cd ../scraper
uv sync
# optional: only if you want crawl4ai-rendered fetching (dou/workua/jobua use it)
uv sync --group browser
uv run playwright install chromium
cd ../..
```

Both services read `DATABASE_URL` from the environment (or their own
`.env`, honored via `pydantic-settings`) with service-specific prefixes as a
fallback-first pattern: `services/llm` looks for `LLM_DATABASE_URL` then
`DATABASE_URL`; `services/scraper` looks for `SCRAPER_DATABASE_URL` then
`DATABASE_URL`. In local dev, having `DATABASE_URL` set in the root `.env` is
enough for both — copy or symlink it, or export it in your shell before
starting each service, since neither uv nor uvicorn walks up to the repo
root for a `.env` file automatically. The simplest reliable approach:

```bash
cp .env services/llm/.env
cp .env services/scraper/.env
```

## 5. Environment configuration reference

### 5.1 Root `.env` (source of truth for services + Docker Compose)

| Variable                                                            | Example                                                            | Notes                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                      | `postgres://postgres:***@localhost:5432/jobhunter?sslmode=disable` | shared by both Python services and `dbmate`                                                                                                                                                                                                               |
| `DBMATE_MIGRATIONS_DIR`                                             | `./infra/db/migrations`                                            | required for `npm run db:*` (see §3.3)                                                                                                                                                                                                                    |
| `DBMATE_SCHEMA_FILE`                                                | `./infra/db/schema.sql`                                            | required for `npm run db:*`                                                                                                                                                                                                                               |
| `REDIS_URL`                                                         | `redis://localhost:6379/0`                                         | provisioned by `infra/docker-compose.yml`                                                                                                                                                                                                                 |
| `WEB_PORT` / `API_PORT` / `SCRAPER_PORT` / `LLM_PORT`               | `3000` / `4000` / `8001` / `8002`                                  | informational; actual ports are read per-service (see §5.2–5.4)                                                                                                                                                                                           |
| `API_BASE_URL` / `SCRAPER_BASE_URL` / `LLM_BASE_URL`                | `http://localhost:4000` / `:8001` / `:8002`                        | used by the API gateway to reach downstream services                                                                                                                                                                                                      |
| `INTERNAL_API_TOKEN`                                                | long random string                                                 | shared secret gateway ↔ n8n ↔ automation endpoints; **must** be ≥16 chars (Zod-validated in `apps/api`)                                                                                                                                                   |
| `N8N_BASE_URL` / `N8N_WEBHOOK_NEW_MATCHES`                          | `http://localhost:5678` / `.../webhook/new-matches`                | reference only — n8n itself needs its own env, see §7                                                                                                                                                                                                     |
| `OLLAMA_BASE_URL`                                                   | `http://localhost:11434`                                           | local LLM provider                                                                                                                                                                                                                                        |
| `OLLAMA_CLOUD_API_KEY` / `OPENROUTER_API_KEY` / `ANTHROPIC_API_KEY` | —                                                                  | only needed if you add/activate those provider rows (see §6)                                                                                                                                                                                              |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT`   | —                                                                  | optional; unauthenticated Reddit JSON works at low volume — see `docs/SOURCES.md`                                                                                                                                                                         |
| `TELEGRAM_BOT_TOKEN`                                                | —                                                                  | secret, env-only, referenced by name (`core.notification_settings.telegram_bot_token_env`) — never DB-stored, never returned by any API response                                                                                                          |
| `TELEGRAM_CHAT_ID`                                                  | —                                                                  | seed/default hint only — the value that actually drives notifications is DB-backed (`core.notification_settings.telegram_chat_id`), edited via Profile → Notifications in the dashboard                                                                   |
| `SMTP_HOST` / `SMTP_PORT`                                           | —                                                                  | seed/default hints only — DB-backed (`core.notification_settings`), edited via the dashboard; also used to manually configure n8n's own SMTP credential (§7.3), which is separate from this env                                                           |
| `SMTP_USER`                                                         | —                                                                  | dual role: seed/default hint for the DB-backed `smtp_user` column **and** still read directly by `email-digest`'s `fromEmail` at n8n runtime (§7.2) — the settings API deliberately excludes an email-account identity, only the destination is DB-backed |
| `SMTP_PASSWORD`                                                     | —                                                                  | secret, env-only, referenced by name (`core.notification_settings.smtp_password_env`) — never DB-stored, never returned by any API response                                                                                                               |
| `DIGEST_TO_EMAIL`                                                   | —                                                                  | seed/default hint only — the value that actually drives the digest recipient is DB-backed (`core.notification_settings.to_email`), edited via the dashboard                                                                                               |
| `SCRAPER_MIN_DELAY_MS` / `SCRAPER_MAX_CONCURRENCY_PER_DOMAIN`       | `1500` / `1`                                                       | politeness defaults; the scraper's actual settings module uses its own `SCRAPER_*`-prefixed vars (see §5.4) — these two are legacy/reference names, prefer the ones below if you need to override                                                         |
| `SCRAPER_LOG_LEVEL` / `LLM_LOG_LEVEL`                               | `info`                                                             | Python services' structured-JSON log level (see ARCHITECTURE.md §9)                                                                                                                                                                                       |
| `LLM_PROVIDER_RETRY_ATTEMPTS`                                       | `3`                                                                | max attempts for provider adapter HTTP calls (network errors, 5xx, 429); bounded exponential backoff                                                                                                                                                      |

### 5.2 `apps/web/.env` (Next.js — copy from `apps/web/.env.example`)

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable              | Purpose                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_URL`             | gateway base URL used server-side: Server Components **and** the same-origin `/api` proxy browser fetches go through                                                   |
| `NEXT_PUBLIC_API_URL` | optional override pointing the browser straight at the gateway (build-time inlined; needs the gateway's `WEB_ORIGIN` to allow the app's origin) — leave unset normally |

`API_URL` defaults to `http://localhost:4000/v1` when unset (note the `/v1`
prefix — the gateway uses NestJS URI versioning). The browser itself talks
to relative `/api/...` paths, so CORS never applies on the normal path and
the dev server can run on any port.

### 5.3 `apps/api/.env` (copy from `apps/api/.env.example`)

```bash
cp apps/api/.env.example apps/api/.env
```

`ConfigModule.forRoot()` in `apps/api/src/app.module.ts` doesn't set an
explicit `envFilePath`, so it loads `.env` from the process's working
directory — which is `apps/api/` when the dev/build script runs
(turborepo/npm workspaces execute each package's script with that package as
cwd). Fill in the values to match the root `.env` — there's no shared loader
between the two, so keep them in sync by hand.

`RATE_LIMIT_TTL` / `RATE_LIMIT_LIMIT` (defaults `60000` ms / `120`) throttle
public endpoints; the internal-token automation surface is exempt.
`DOWNSTREAM_RETRY_ATTEMPTS` (default `3`) bounds retries on safe/idempotent
calls to the scraper/LLM services. All three have working defaults — only
override them if you have a specific reason to.

### 5.4 Python services — env var prefixes

Both services validate settings via `pydantic-settings` (`extra="ignore"`,
`env_file=".env"`), each reading `.env` from its own directory (hence §4's
`cp .env services/<x>/.env`).

| Prefix     | Service            | Notable overridable settings                                                                                                                                                                                                                                                    |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LLM_`     | `services/llm`     | `LLM_DATABASE_URL` (else `DATABASE_URL`), `LLM_REQUEST_TIMEOUT_S`, `LLM_PROVIDER_CACHE_TTL_S`, `LLM_COVER_LETTER_THRESHOLD`, `LLM_LOG_LEVEL`, `LLM_PROVIDER_RETRY_ATTEMPTS`                                                                                                     |
| `SCRAPER_` | `services/scraper` | `SCRAPER_DATABASE_URL` (else `DATABASE_URL`), `SCRAPER_MIN_DELAY_SECONDS`, `SCRAPER_JITTER_SECONDS`, `SCRAPER_RESPECT_ROBOTS`, `SCRAPER_MAX_LEADS_PER_QUERY`, `SCRAPER_MAX_PROCESS_ATTEMPTS`, `SCRAPER_LOG_LEVEL`, `SCRAPER_AGENT_BROWSER_CMD` (default `npx -y agent-browser`) |

Per-source politeness (`min_delay`, `jitter`, `respect_robots`) is **not**
an env var — it overrides the scraper's `SCRAPER_MIN_DELAY_SECONDS` /
`SCRAPER_JITTER_SECONDS` / `SCRAPER_RESPECT_ROBOTS` defaults per source, via
JSON keys in that source's `core.sources.config` (editable from the
Sources admin page or directly in the DB).

## 6. LLM provider configuration

The seed's default active provider is local Ollama. To use it:

```bash
ollama pull qwen3:14b   # satisfies llm_providers.default_model
# optional, to match the seeded per-pipeline overrides exactly:
ollama pull qwen3:8b
ollama pull qwen3:32b
```

To add another provider (no code change — it's a DB row), use the
dashboard's LLM settings page → **Add provider** (`kind` one of `ollama` /
`openai-compatible` / `anthropic`; created inactive) → **Test connection** to
confirm it actually works → **Configure** to set the default model and any
per-pipeline overrides → switch it active once ready. See
[LLM_CONFIG.md](LLM_CONFIG.md) for the full provider model, hot-switch flow,
and secrets policy (API keys are env-var **names** in the DB — actual values
live only in `.env`, added there before the provider can test/complete
successfully).

## 7. n8n workflows

n8n runs as its own long-lived container, separate from the app services.

### 7.1 Get an n8n instance

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e GENERIC_TIMEZONE="Europe/Kyiv" \
  n8nio/n8n
```

### 7.2 Set n8n's own environment variables

n8n runs in its own container, so `localhost` inside it does **not** reach
your host services — use `host.docker.internal` (Docker Desktop) instead:

| Variable                  | Example                               |
| ------------------------- | ------------------------------------- |
| `JOB_HUNTER_API_BASE_URL` | `http://host.docker.internal:4000/v1` |
| `JOB_HUNTER_LLM_BASE_URL` | `http://host.docker.internal:8002`    |
| `SMTP_USER`               | from root `.env`                      |

Set these on the n8n container (`docker run -e ...` or `docker update` +
restart) and restart it so they take effect.

`TELEGRAM_CHAT_ID` and `DIGEST_TO_EMAIL` are **not** n8n container env vars
anymore (notification-settings-and-board-reorder change) — both workflows
now fetch the destination from `GET /v1/automation/settings` and gate on
whether the channel is enabled, both edited in the dashboard under Profile
→ Notifications rather than in n8n's environment. See
[`n8n/README.md`](../n8n/README.md) for the exact node-level detail.

### 7.3 Import workflows and create credentials

Full step-by-step is in [`n8n/README.md`](../n8n/README.md); summary:

1. Import all four: **Workflows → Import from File** (UI) or
   `n8n import:workflow --separate --input=n8n/workflows/` (CLI). They import
   **inactive** — leave them that way until credentials + env vars below are
   set, or an active workflow with a missing credential fails on every tick.
2. Create three credentials in the n8n UI (referenced by name only — the
   exported JSON carries no secrets):
   - **"Job Hunter Internal Token"** (Header Auth, `X-Internal-Token`) = root `.env`'s `INTERNAL_API_TOKEN`
   - **"Job Hunter Telegram Bot"** (Telegram API) = `TELEGRAM_BOT_TOKEN`
   - **"Job Hunter SMTP"** (SMTP) = `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`
3. Activate one at a time and verify per `n8n/README.md`'s "Verifying end to
   end" checklist.

## 8. Running the stack

Two supported paths: native processes for day-to-day development (fast
reload, direct debugger access), or the full Docker Compose stack — every
service now has a `Dockerfile` (`services/llm/Dockerfile`,
`services/scraper/Dockerfile`, `apps/api/Dockerfile`, `apps/web/Dockerfile`)
and compose treats Docker's own restart policy as the process manager
(`restart: unless-stopped` on every service).

### 8.1 Option A — Docker Compose (full stack)

First, set the Postgres credentials the containers will actually use:

```bash
cp infra/.env.example infra/.env   # fill in POSTGRES_USER/POSTGRES_PASSWORD
```

This is a **separate** file from the repo-root `.env` — Docker Compose
auto-loads a `.env` from the same directory as `docker-compose.yml` (i.e.
`infra/`) for `${...}` substitution, and does _not_ read the repo-root one
for that purpose (the repo-root `.env` still reaches containers via each
service's `env_file: ../.env`, but that's runtime env injection, a
different mechanism from compose-file substitution). Set
`POSTGRES_USER`/`POSTGRES_PASSWORD` here to match the repo-root `.env`'s
`DATABASE_URL` credentials — without it, containers fall back to a
`postgres`/`CHANGE_ME` guess that won't authenticate against a real
instance.

Ensure the long-lived Postgres container is attached to the shared network
(both commands are one-time setup; existing-resource errors are harmless):

```bash
docker network create job-hunter-database
docker network connect job-hunter-database pg-learn
```

```bash
docker compose -f infra/docker-compose.yml --profile services up -d --build
```

This builds and starts `redis`, `scraper`, `llm`, `api`, and `web` together,
networked by Docker Compose's default DNS (services reach each other by
name — `http://scraper:8001`, `http://llm:8002`, `http://api:4000` — set
that way already in the compose file's `environment:` blocks). Postgres still
isn't started by this file (§3.1) — the containers reach the existing
`pg-learn` container directly over the external `job-hunter-database` network.

- Web dashboard: http://localhost:3000
- API gateway: http://localhost:4000/v1, Swagger UI at http://localhost:4000/api
- Scraper: http://localhost:8001/health
- LLM service: http://localhost:8002/health

`docker compose -f infra/docker-compose.yml up -d` (no `--profile`) starts
only `redis` — useful if you're running the rest natively (§8.2) and just
need the queue.

The scraper image installs the `browser` dependency group + a Playwright
Chromium (needed by the seeded `dou`/`workua`/`jobua` sources, which use
`fetch_strategy=crawl4ai`) by default; build with `--build-arg
INSTALL_BROWSER=false` for a smaller image if you only run `api`-strategy
sources.

> **Ollama from inside the `llm` container**: the seeded `ollama-local`
> provider row's `base_url` is `http://localhost:11434`, which is correct
> for native processes but unreachable from _inside_ a container (that
> `localhost` means the container itself). If you're running the full
> Docker Compose stack and want to actually use local Ollama, update that
> row's `base_url` to `http://host.docker.internal:11434` — via the
> dashboard's LLM settings page (card → **Configure** → Base URL), or
> `UPDATE core.llm_providers SET base_url =
'http://host.docker.internal:11434' WHERE slug = 'ollama-local'`. This is
> DB data, not something either `.env` file controls, so it's not fixed
> automatically by switching between native and Docker. **Test connection**
> on the card confirms which case you're in: a genuine `ConnectError` means
> the fix above hasn't been applied yet.

### 8.2 Option B — native processes (recommended for active development)

Four processes, each in its own terminal:

```bash
# 1. LLM service (FastAPI + LangGraph)
cd services/llm && uv run uvicorn llm.main:app --port 8002 --reload

# 2. Scraper service (FastAPI)
cd services/scraper && uv run uvicorn scraper.main:app --port 8001 --reload

# 3 & 4. Web + API gateway together (turborepo)
npm run dev   # from repo root — starts apps/web (:3000) and apps/api (:4000) in parallel
```

> **Windows caveat**: `services/scraper` and `services/llm` cannot start
> natively on Windows today — a pre-existing `psycopg`/`ProactorEventLoop`
> incompatibility blocks the asyncio Postgres pool from opening. Run them
> under WSL2, in a Linux/macOS environment, or use Option A (Docker) instead
> — the container images are Linux-based, so this doesn't affect them.
> Lint/type-check/test gates (`uv run pytest`, `ruff`, `mypy`) are
> unaffected and run fine natively on Windows — it's specifically booting
> the live `uvicorn` server that's blocked.

> **`apps/api`'s `npm run dev` caveat**: `tsx watch` (esbuild) boots the
> gateway and maps every route with no error, but esbuild's
> decorator-metadata emission breaks NestJS's constructor-based DI at
> request time — every controller's injected service silently reads as
> `undefined`, so every real endpoint (anything beyond `/health`) 500s.
> Confirmed by reproducing directly: identical failure under `tsx watch`,
> works correctly under the `tsc` build (`npm run build -w apps/api && npm
run start -w apps/api`). If you need the gateway to actually serve
> requests outside Docker, use the build+start pair instead of `dev`; CI's
> e2e job does the same (see `.github/workflows/ci.yml`).

### 8.3 Production build (native, without Docker)

Build order matters for the generated API client: `packages/shared-ts`
depends on `apps/api/openapi.json` being current, but that's a **file**
dependency, not a package dependency — turborepo's `^build` graph won't
regenerate it for you (this applies to the Docker builds too — re-run
`openapi:emit` and commit the result before building images if routes
changed).

`npm run build`/`npm run check` need the root `package.json`'s
`"packageManager": "npm@12.0.1"` field to resolve the workspace graph —
turbo errors with "Could not resolve workspace" without it. That field was
missing and is added as part of this guide.

```bash
# 1. If apps/api's routes/DTOs changed since the committed openapi.json:
npm run openapi:emit -w apps/api        # regenerates apps/api/openapi.json
npm run generate -w packages/shared-ts  # regenerates src/generated/api.ts from it

# 2. Build everything (turborepo resolves apps/web ← packages/shared-ts automatically)
npm run build

# 3. Start the TS services
npm run start -w apps/api     # node dist/main.js
npm run start -w apps/web     # next start, serves the built .next output
```

For the Python services outside Docker, run the same `uv run uvicorn
<module>:app --port <port>` commands as dev, minus `--reload`, behind
whatever process manager and reverse proxy (nginx/Caddy) you choose — or
just use Option A, which already wires `restart: unless-stopped`.

## 9. Known gaps & follow-ups

Documented here rather than glossed over, so you don't lose time
rediscovering them:

- **`agent-browser`'s CLI contract is unverified.** The scraper's
  `AgentBrowserFetcher` guesses a `read [url]` command shape defensively;
  before relying on the `agent-browser` fetch strategy (used by the
  disabled-by-default `upwork` source) for real, install the CLI locally
  (`npm i -g agent-browser && agent-browser install`), then run
  `agent-browser skills get core --full` for the authoritative command
  reference, and adjust `SCRAPER_AGENT_BROWSER_CMD` / the output-parsing
  logic if the real contract differs.
- **Redis is provisioned but not yet used for the scraper→LLM handoff** —
  `ARCHITECTURE.md` describes a queue; Phase 6 shipped gateway polling
  instead. Revisit if scale demands it.
- **n8n Telegram/SMTP credentials don't exist yet** on any real instance —
  the workflows have never been exercised end-to-end outside of schema
  validation. See `n8n/README.md` → "Verifying end to end".
- **The e2e CI job (§10.1) has never run on a real GitHub Actions runner.**
  It was written and reviewed carefully (YAML syntax validated, the seed SQL
  tested in a rolled-back transaction against a live DB, the gateway's real
  health path confirmed empirically) but could not be executed end-to-end
  from the environment that wrote it. It runs with `continue-on-error: true`
  and an explicit TODO for exactly this reason — remove that once it's
  proven stable across a few real runs.

## 10. Quality gates (per service)

Useful when validating an install or before deploying a change:

```bash
# services/llm
cd services/llm && uv run pytest -q && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict src

# services/scraper
cd services/scraper && uv run pytest -q && uv run ruff check . && uv run ruff format --check . && uv run mypy --strict src

# apps/api, packages/shared-ts, apps/web, all at once (turbo)
npm run check   # lint + typecheck + test across every TS workspace
npm run build

# apps/web e2e (optional — needs the API running on :4000 + seeded jobs):
cd apps/web && npm run test:e2e:install && npm run test:e2e
```

### 10.1 Continuous integration

`.github/workflows/ci.yml` runs exactly the commands above on every push and
PR to `master`: one job per Python service (`uv sync --locked`, `ruff
check`, `ruff format --check`, `mypy --strict`, `pytest` — coverage-gated,
see §5 above) plus one `node` job (`npm ci && npm run check && npm run
build`, covering `apps/web`, `apps/api`, and `packages/shared-ts` via
turbo — `test` is also coverage-gated here). A fourth `e2e` job runs the
Playwright happy path against a real, freshly-provisioned stack: a
GitHub Actions `postgres:17` service container, migrated + seeded via
`dbmate`/`psql` directly (not `npm run db:seed`, which assumes a local
`pg-learn` Docker container that doesn't exist in CI), then scraper/LLM/the
gateway started as native processes per §8.2's documented approach (the
Windows/WSL native-boot limitation in that section is Windows-specific and
doesn't apply to the Linux CI runner). It seeds one real job row directly
via SQL so the happy path exercises the full interactive flow, not just its
own empty-state skip. This job runs with `continue-on-error: true` — see
§9's note on why, and remove that flag once it's proven stable. CI does not
yet build/push the Docker images — a reasonable follow-up once there's a
place to deploy them to.
