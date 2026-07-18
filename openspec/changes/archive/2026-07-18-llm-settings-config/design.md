# Design: llm-settings-config

## Context

Current state (verified against code, not docs):

- **DB** — `core.llm_providers`: `slug`, `kind` (CHECK `ollama | openai-compatible | anthropic`), `base_url`, `default_model`, `api_key_env` (env-var _name_, never a value), `pipeline_overrides jsonb` (`{"match": {"model": "...", "temperature": 0.2}, ...}`), `is_active`, `params jsonb`. Every column this change touches already exists; **no migration**.
- **LLM service** (`services/llm`) — `Db.set_active` is the write-path precedent: UPDATE + `NOTIFY llm_config_changed` inside one connection; the LISTEN loop (`listener.py`) plus a 30s TTL cache make config hot-reload without restarts. `ProviderResolver.resolve(pipeline)` applies `pipeline_overrides[pipeline].model/temperature` over `default_model` (resolution order documented in `docs/LLM_CONFIG.md`). Each provider adapter (`providers/ollama.py`, `openai_compat.py`, `anthropic.py`) already implements `health()` via a shared `probe()` helper hitting `/api/tags`, `/models`, `/v1/models` respectively — **capability exists, endpoint doesn't**. `registry.build_provider(row, client)` constructs an adapter from any row; `resolve_api_key` raises `MissingApiKeyError` when the row names an env var that is unset.
- **Gateway** (`apps/api/src/llm-admin/`) — thin proxy module: port `LlmAdminClient` (`listProviders`/`setActiveProvider`/`testConnection`), HTTP client, service, controller. `testConnection()` fetches the **LLM service's `/health`** — it never touches a provider. Providers travel snake_case from the LLM service and are mapped to camelCase domain models in `http-llm-admin.client.ts`.
- **Web** (`apps/web/src/components/llm/`) — `llm-settings-page.tsx` (query + switch/test mutations, per-slug test-state record) and `provider-card.tsx` (radio + `window.confirm` switch, Test disabled on non-active cards with a hint). `lib/api/llm.ts` has `listLlmProviders`/`setActiveLlmProvider`/`testLlmConnection`. UI kit already includes `Dialog`, `Select`, `Command` (cmdk), `Input`, `Textarea`. The `SourceFormDialog` from `sources-page-crud` established the outer-stateless-dialog + keyed-inner-form pattern (avoids `react-hooks/set-state-in-effect`, which this repo's ESLint enforces as an error).

## Goals / Non-Goals

**Goals:**

- Add a custom provider from the UI: URL mandatory, API key optional, created inactive so the create → Test → switch flow verifies it before it ever serves a pipeline.
- Test any provider — active or not — through its _real_ adapter and probe, before trusting it with a switch.
- Choose a provider's default model from a live, provider-reported model list (with graceful free-text fallback).
- Edit a provider's connection (`base_url`, `api_key_env`) and per-pipeline overrides (model + temperature for `normalize`/`tag`/`match`/`cover_letter`) from the UI.
- Every config write hot-reloads running workers via the existing NOTIFY/LISTEN machinery — no restarts, same guarantee the active-switch already has.

**Non-Goals:**

- Deleting provider rows (the one-active partial unique index and `llm.pipeline_runs.provider_slug` history make deletion a footgun; switching away deactivates in practice).
- Editing `slug` or `kind` after creation (identity), or the `params` JSONB.
- Storing raw API key **values** in the DB or accepting them over HTTP (see D5).
- Auth on these endpoints (none exists on the dashboard API; Phase 7 scope).
- Preserving `POST /v1/llm/providers/test-connection` — removed, not deprecated (single consumer, personal tool).

## Decisions

### D1 — Test builds the adapter per-request, without touching the active row

`POST /providers/{slug}/test` (LLM service): load the row by slug (404 unknown), `build_provider(row, client)` with the app's shared HTTP client, call `health()`, return `{ok, detail, elapsed_ms}` with HTTP 200 for **both** outcomes — a failing probe is a successful test-execution (same philosophy as `sources-page-crud`'s test endpoint; 502 stays reserved for "couldn't reach the LLM service itself" at the gateway hop). Two build-time failures must map to results, not 500s: `MissingApiKeyError` → `{ok: false, detail: "missing API key env <NAME>"}` (actionable, no secret values) and `UnknownProviderKindError` → `{ok: false, detail}` (defensive; CHECK constraint makes it near-impossible). The active provider, resolver cache, and DB are untouched. Alternative considered: reuse the resolver — rejected, it only resolves the _active_ row.

### D2 — `list_models()` joins the provider port

Each adapter's model list comes from the same endpoint its `health()` already probes, so the new port method reuses the adapter's client/headers/base-url plumbing: Ollama `GET /api/tags` → `models[].name`; OpenAI-compatible `GET /models` → `data[].id`; Anthropic `GET /v1/models` → `data[].id`. `GET /providers/{slug}/models` returns `{models: [...], error: null}` on success and `{models: [], error: "<detail>"}` on provider failure — 200 either way, mirroring D1's failure-is-an-answer semantics, so the UI can fall back to free-text without special-casing transport errors. Ordering: as returned by the provider (Ollama returns install order; cloud lists are already grouped sensibly); no server-side sorting or caching — the click is manual and rare, freshness beats a cache.

### D3 — `PATCH /providers/{slug}` with the same NOTIFY discipline as `set_active`

New `Db.update_provider(slug, default_model?, pipeline_overrides?, base_url?, api_key_env?)`: dynamic UPDATE of only the provided fields + `NOTIFY llm_config_changed` in the same connection, returning the row (`None` → 404). The route also calls `resolver.invalidate()` locally (same belt-and-braces as the active-switch route — NOTIFY covers other workers, invalidate covers this process synchronously). Validation at the route: `pipeline_overrides` keys must be a subset of the four `PipelineName` literals; each entry allows only `model: str` and/or `temperature: float 0..2`; `default_model` and `base_url` non-empty strings when present; `api_key_env` accepts a string **or explicit `null`** (clear the key requirement — distinct from "field omitted"; model with a sentinel-default so pydantic can tell the two apart). **Replace, not merge** for `pipeline_overrides`: the submitted object replaces the column wholesale — the UI always round-trips the full object it loaded, and merge semantics for removing an override are strictly worse to reason about. `base_url`/`api_key_env` are editable on _any_ provider, not only UI-created ones — there is no `is_custom` flag (adding one needs a migration for zero benefit), and "fix a typo'd URL" is legitimate on a seeded row too. Alternative considered: per-pipeline sub-resource (`PUT /providers/{slug}/overrides/{pipeline}`) — rejected as REST ceremony for a 4-key object edited in one dialog.

### D4 — `POST /providers` creates inactive; no NOTIFY on create

New `Db.create_provider(slug, kind, base_url, default_model, api_key_env?)`: `INSERT ... ON CONFLICT (slug) DO NOTHING RETURNING *` (`None` → 409 at the route — same convention as `sources-page-crud`'s repository). `is_active` is **not** accepted: rows are born inactive (schema default; the `idx_llm_providers_one_active` partial unique index stays the single arbiter of activeness, and activation remains the existing `PUT /providers/active` with its own NOTIFY). Because an inactive row cannot be resolved by any pipeline, create sends **no NOTIFY** — there is nothing for workers to reload; the first NOTIFY-worthy event is activation or a later PATCH. `kind` is a client choice from the three registry kinds, defaulting to `openai-compatible` in the UI (LLM_CONFIG.md: "one adapter, many providers — just `base_url` + key"); the DB CHECK constraint backstops it. `pipeline_overrides` starts `{}` (column default) — configure after creation if wanted.

### D5 — API key stays an env-var _name_; raw values are never accepted

The repo has an explicit, documented secrets policy (ARCHITECTURE.md §6, LLM_CONFIG.md): the DB stores `api_key_env` — the _name_ of an environment variable — and "the dashboard never displays or transmits key values". The create/edit forms honor it: the optional "API key" field captures an env-var name (UI pre-suggests one derived from the slug, e.g. `MYPROVIDER_API_KEY`), with inline hints that (a) the value must be added to `.env` and (b) the service must be restarted/recreated to see it (`resolve_api_key` reads `os.environ`, which Docker fixes at container start). The per-slug Test button then closes the loop: an unset variable reports `ok: false, detail: "missing API key env MYPROVIDER_API_KEY"` (D1), so a half-finished setup is diagnosable from the UI. Alternative considered — accept the raw key value and store it (DB column or `params`): rejected. It would reverse a documented architectural policy, put plaintext secrets in Postgres and in the browser's request stream on an **unauthenticated** localhost API, and leak into `pg_dump`s (`infra/db/schema.sql` workflows dump this database). The env-name design costs one `.env` edit per cloud provider — a deliberate, acceptable friction. This is the interpretation of the request's "api key (optional)": the _capability_ is optional-key support, not raw-value storage.

### D6 — Gateway stays a dumb proxy; old test endpoint removed

`LlmAdminClient` gains `createProvider(input)`, `testProvider(slug)`, `listModels(slug)`, `updateProvider(slug, patch)`; controller adds `POST /providers` (201; LLM-service 409 passes through as `ConflictException`), `POST /providers/:slug/test` (`@HttpCode(200)`), `GET /providers/:slug/models`, `PATCH /providers/:slug`; `testConnection` (port method, service method, controller route, client implementation) is deleted outright. Route-order note: `PUT providers/active` (different verb) and the new `:slug` routes cannot collide, and there is no static-vs-`:slug` GET conflict (`GET providers` has no trailing segment) — unlike `sources-admin`, no ordering hazard exists; noted here so nobody "fixes" it defensively. snake→camel mapping happens in the HTTP client as it already does for providers.

### D7 — Two dialogs, both following the `SourceFormDialog` pattern

Both dialogs use the outer-stateless-`Dialog` + inner-form-mounted-while-open pattern, keyed so a fresh mount gives fresh `useState` with no reset-effect (repo ESLint forbids `set-state-in-effect`).

**Create — `provider-form-dialog.tsx`** (opened by an "Add provider" button on the page header): slug (required, `^[a-z0-9-]+$`, same convention as sources), kind `Select` over the three registry kinds defaulting to `openai-compatible`, base URL (required, URL-validated), default model (required, **free text** — the provider may not be reachable or keyed yet, so no live combobox at create time; refine later via Configure), API key env-var name (optional, pre-suggested from the slug e.g. `MYPROVIDER_API_KEY`, with the hints from D5 about `.env` + restart). Submit → `POST`, 409 → inline slug error, success → invalidate providers, toast, close; the new card appears inactive with Test one click away.

**Configure — `provider-config-dialog.tsx`** (per-card "Configure" action): **connection section** — base URL (required) and API key env-var name (optional; clearing the field sends explicit `null` per D3); **default model** as a cmdk `Command` combobox seeded from `GET .../models` (typing filters; entering a value not in the list is allowed — critical because cloud lists can fail or be huge, and Ollama users may want a model they haven't pulled yet, which is a legitimate row state); **pipeline overrides** as four fixed rows (`normalize`, `tag`, `match`, `cover_letter`), each with an optional model combobox (same source) and an optional temperature number input (0–2, step 0.1); blank fields mean "inherit default" and are omitted from the object. Save → `PATCH`, invalidate `queryKeys.llm.providers`, toast, close. The models query runs only while the dialog is open (`enabled`), keyed `['llm', 'models', slug]`.

### D8 — Test UX: same inline-state pattern, now honest and universal

`provider-card.tsx`: Test enabled on every card; the `testOnlyActive` hint dies. Latency shown from the server's `elapsed_ms` (measures the provider probe, not browser→gateway→service overhead; the current client-side `performance.now()` measurement goes away). Failure shows the probe's `detail` (exception class name from the shared `probe()` helper, or the missing-key message). Keep the existing per-slug `ConnectionTestState` record in the page component — it already does exactly this job.

## Risks / Trade-offs

- [Model lists from OpenRouter-class providers are huge (hundreds of entries)] → cmdk combobox filters as you type; list renders max ~200 items with the filter cutting further; no pagination — this is a personal tool.
- [`list_models` on Anthropic/OpenAI-compat requires a valid API key, so the combobox is empty exactly when the key is missing] → the free-text fallback plus the `error` field cover it; the Test button diagnoses the key problem explicitly.
- [Replace-not-merge on `pipeline_overrides` could clobber concurrent edits] → single-operator tool; the dialog round-trips the object it loaded; acceptable.
- [Removing `POST /providers/test-connection` breaks any unknown external caller] → gateway is unauthenticated localhost with exactly one known consumer (the web page); n8n workflows don't call it (verified: they call `/v1/automation/*` and `/v1/sources/*` only).
- [A bogus `default_model` (typo in free text) breaks pipeline runs at request time] → the Test button doesn't validate models; `pipeline_runs.status='failed'` already records model errors, and the combobox makes typos unlikely. Accepted; model-existence validation would couple the PATCH to provider availability.
- [`NOTIFY` without payload wakes all listeners for any change] → identical to the existing `set_active` behavior; listeners just drop a 30s cache.
- [The env-var-name key flow needs a `.env` edit + container recreate before a keyed provider works] → deliberate (D5); the create dialog says so inline, and Test reports the missing variable by name until it's done — a diagnosable half-state, not a silent one.
- [A UI-created provider with a wrong `kind` (e.g. `anthropic` pointed at an OpenAI endpoint) fails confusingly] → Test surfaces it immediately (probe hits the wrong path shape → `ok: false` with the HTTP error class); `kind` is immutable post-create, so the fix is create-again-correctly — acceptable at this tool's scale, noted in the create dialog's kind hint.

## Migration Plan

No DB migration. Deploy LLM service first (new endpoints additive), then gateway (removes the old test route it alone consumed), then web. Rollback = revert; no persisted-shape changes. OpenAPI: `npm run openapi:emit -w apps/api` → `npm run generate -w packages/shared-ts` → commit both. Watch for the `openapi-typescript` quirk found in `sources-page-crud`: never put `default:` in an `@ApiPropertyOptional` schema — it makes the generated TS property required.

## Open Questions

_None blocking. If Ollama's `/api/tags` shape differs across versions (`models` vs legacy `tags` key), handle defensively in the adapter — decide at implementation, it's adapter-internal._
