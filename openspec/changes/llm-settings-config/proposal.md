# Proposal: llm-settings-config

## Why

The `/settings/llm` page can only switch the active provider. There is no way to add a provider (`docs/LLM_CONFIG.md` promises "adding an OpenAI-compatible provider = inserting a row, no code" — but the only way to insert that row is hand-written SQL), no way to configure one — its model is fixed to whatever `core.llm_providers.default_model` was seeded with, and per-pipeline overrides (the mechanism LLM_CONFIG.md presents as the core configuration surface) are invisible and uneditable. Worse, the existing "Test connection" button is misleading: the gateway implements it as a fetch of the **LLM service's own `/health`** — it proves the FastAPI process is up and says nothing about whether Ollama/OpenRouter/Anthropic actually responds — while every provider adapter already has a real `health()` probe (`/api/tags`, `/models`, `/v1/models`) that no REST endpoint exposes. Testing is also artificially limited to the active provider, so you cannot verify a provider _before_ switching to it.

## What Changes

- **Real per-provider connection test**: new LLM-service endpoint `POST /providers/{slug}/test` that builds the actual provider adapter for that row (without activating it) and calls its existing `health()` probe; gateway proxies at `POST /v1/llm/providers/{slug}/test`. Works for **any** provider, active or not. A missing API key (`MissingApiKeyError` at build time) reports as `ok: false` with detail — not a 500.
- **BREAKING**: `POST /v1/llm/providers/test-connection` (and the LLM-service-health-fetch behind it) is removed, replaced by the per-slug test. The web page is its only consumer.
- **Live model lists**: new `list_models()` on the provider port (Ollama `GET /api/tags`, OpenAI-compatible `GET /models`, Anthropic `GET /v1/models` — the same endpoints the health probes already hit), exposed as `GET /providers/{slug}/models` and proxied by the gateway. Feeds the model selector; degrades to free-text entry when the list is unavailable.
- **Add a custom provider**: new `POST /providers` on the LLM service (gateway proxy `POST /v1/llm/providers`) creating a row from the UI: slug, kind (defaulting to `openai-compatible` — the "any URL + key" kind LLM_CONFIG.md designed for exactly this), **base URL (mandatory)**, default model (mandatory — pipeline resolution requires one), and **API key (optional)** — captured as an env-var _name_ per the repo's secrets policy (the DB never stores key values; see design D5), with the Test button diagnosing an unset variable by name. New providers are created **inactive** (schema default; the one-active partial unique index stays authoritative) — the flow is create → Test → switch. Duplicate slug → 409.
- **Provider configuration**: new `PATCH /providers/{slug}` on the LLM service updating `default_model`, `pipeline_overrides` (per-pipeline model + temperature for `normalize` / `tag` / `match` / `cover_letter`), **`base_url`**, and **`api_key_env`** — with creation in scope, "fix a typo'd URL / point at the right key" is a legitimate edit, not a new identity. Broadcasts `NOTIFY llm_config_changed` so running workers hot-reload exactly like the active-switch does; gateway proxy `PATCH /v1/llm/providers/{slug}`.
- **Web UI**: an "Add provider" button opens a create dialog (slug / kind / base URL / default model / API key env var); every provider card gains an enabled Test button (per-slug, real probe, inline result) and a "Configure" action opening a dialog with connection fields (base URL, API key env var), a default-model combobox (live model list + free-text fallback), and a per-pipeline overrides editor (model + temperature per pipeline, blank = inherit default). Active-provider switching keeps its current flow.
- OpenAPI + generated `shared-ts` client regenerated.

Out of scope (deliberately): deleting provider rows (the one-active index and run-history references make deletion a footgun; deactivate-by-switching-away suffices — separate change if wanted), editing `slug` / `kind` after creation (identity), editing the `params` JSONB (num_ctx etc. — niche, SQL remains fine), storing raw API key **values** anywhere (see design D5 — the documented secrets policy stands), and any auth on these endpoints (consistent with the rest of the dashboard API).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `llm-admin-ui`: the "Connection test" requirement changes to per-provider real probing (MODIFIED); new requirements for adding a custom provider, provider configuration (connection fields + default model + pipeline overrides), live model listing, and the LLM-service endpoints backing them (ADDED — service endpoints folded into this capability, following the `sources-admin` precedent from `sources-page-crud`).

## Impact

- **`services/llm`**: `LLMProvider` protocol gains `list_models()` (all 3 adapters + test fakes updated); `Db` gains `get_provider(slug)`, `create_provider(input)`, and `update_provider(slug, patch)` (writes + `NOTIFY llm_config_changed` where resolution can be affected); routes gain `POST /providers`, `POST /providers/{slug}/test`, `GET /providers/{slug}/models`, `PATCH /providers/{slug}`.
- **`apps/api`**: `LlmAdminClient` port + HTTP client + service + controller gain `createProvider` / `testProvider` / `listModels` / `updateProvider`; old `testConnection` removed; new DTOs; OpenAPI regenerated.
- **`packages/shared-ts`**: regenerated client (the removed operation disappears from `ApiOperations`).
- **`apps/web`**: `lib/api/llm.ts` reworked (create, per-slug test, models, update); `llm-settings-page.tsx` gains the Add-provider button; `provider-card.tsx` Test enabled for all cards + Configure action; new `provider-form-dialog.tsx` (create) and `provider-config-dialog.tsx` (configure); EN + UK catalogs extended; client-layer vitest specs.
- **DB**: no migration — every needed column exists (`slug` UNIQUE → 409 mapping, `kind` CHECK, `is_active DEFAULT false`, one-active partial unique index).
