# llm-admin-ui

## Purpose

The `/settings/llm` page: manage LLM providers — view provider cards, switch the active provider with confirmation, and test connections inline.

## Requirements

### Requirement: Provider cards

The `/settings/llm` page SHALL list LLM providers from `GET /v1/llm/providers` as cards showing name, model, kind (local/cloud), and health/latency indicator, with the active provider marked by a radio/active state.

#### Scenario: Viewing providers

- **WHEN** the user opens `/settings/llm`
- **THEN** all configured providers render as cards and exactly one is marked active

### Requirement: One-click active switch with confirm

Selecting a different provider SHALL require a single confirmation, then persist via `PUT /v1/llm/providers/active`. The UI SHALL reflect the switch immediately on success and roll back with an error toast on failure (the backend hot-switch needs no restart).

#### Scenario: Switching provider

- **WHEN** the user selects "ollama-cloud" and confirms
- **THEN** the active flag moves to that card and a toast confirms the switch

#### Scenario: Switch failure

- **WHEN** the activation request fails
- **THEN** the previous provider remains marked active and an error toast explains the failure

### Requirement: Connection test

Each provider card SHALL offer a "Test connection" action for **any** provider (active or not), calling `POST /v1/llm/providers/{slug}/test`, which the gateway proxies to the LLM service's `POST /providers/{slug}/test`. The test SHALL build the real provider adapter for that row (without activating it or touching the resolver cache) and call its health probe against the provider's own API (Ollama `/api/tags`, OpenAI-compatible `/models`, Anthropic `/v1/models`) — not merely check that the LLM service process is up. The result (`ok` with the server-measured probe latency, or `ok: false` with a human-readable detail) SHALL render inline on the card — not only in a toast — with a pending state while in flight. A failing probe SHALL still be an HTTP 200; 502 SHALL be reserved for the LLM service itself being unreachable. A provider whose `api_key_env` names an unset environment variable SHALL test as `ok: false` with a detail naming the missing variable (never its value), not as a server error.

#### Scenario: Successful test

- **WHEN** the user tests the local Ollama provider and its daemon responds
- **THEN** the card shows an inline success result with the probe latency measured by the LLM service

#### Scenario: Failed test

- **WHEN** the tested provider is unreachable
- **THEN** the card shows an inline, human-readable error and the active provider is unchanged

#### Scenario: Testing a non-active provider

- **WHEN** the user tests a provider that is not currently active
- **THEN** the test runs against that provider's API and reports its result, without switching the active provider

#### Scenario: Missing API key

- **WHEN** the user tests a provider whose `api_key_env` variable is not set in the environment
- **THEN** the card shows `ok: false` with a detail naming the missing variable, and no 500 occurs

### Requirement: Provider model listing

The LLM service SHALL expose `GET /providers/{slug}/models`, returning the models reported live by that provider's API (Ollama `GET /api/tags`, OpenAI-compatible `GET /models`, Anthropic `GET /v1/models`) as `{models: [...], error: null}`, or `{models: [], error: "<detail>"}` when the provider call fails — HTTP 200 in both cases, 404 for an unknown slug. The gateway SHALL proxy this at `GET /v1/llm/providers/{slug}/models`.

#### Scenario: Listing Ollama models

- **WHEN** the models endpoint is called for a reachable Ollama provider
- **THEN** the response lists the locally installed model names

#### Scenario: Provider unavailable

- **WHEN** the provider's API cannot be reached or rejects the request
- **THEN** the response is still 200 with an empty model list and a human-readable error detail

### Requirement: Add a custom provider

The `/settings/llm` page SHALL offer an "Add provider" action opening a create dialog with fields: slug (required, `^[a-z0-9-]+$`, immutable after creation), kind (required, one of `ollama` / `openai-compatible` / `anthropic`, defaulting to `openai-compatible`), base URL (**required**, valid URL), default model (required, free text), and API key environment-variable name (**optional** — per the secrets policy the DB SHALL store only the variable's _name_; key values are never accepted over HTTP or stored, and the dialog SHALL state that the value belongs in the environment and needs a service restart to take effect). Submitting SHALL call `POST /v1/llm/providers` (gateway → LLM service `POST /providers`), which inserts the row **inactive** (`is_active` SHALL NOT be settable at creation; activation stays with the existing switch flow) with empty pipeline overrides. A duplicate slug SHALL return 409 and surface as an inline error on the slug field. On success the provider list SHALL refresh, a toast SHALL confirm, and the new card SHALL be immediately testable and configurable like any other.

#### Scenario: Adding an OpenAI-compatible provider

- **WHEN** the user adds slug `groq` with kind `openai-compatible`, base URL `https://api.groq.com/openai/v1`, a default model, and API key env name `GROQ_API_KEY`, then submits
- **THEN** the row persists inactive, the dialog closes, and a `groq` card appears with Test and Configure available while the active provider is unchanged

#### Scenario: Keyless local provider

- **WHEN** the user adds a provider with a base URL and no API key env name (e.g. a local vLLM endpoint)
- **THEN** the row persists with `api_key_env` null and its adapter builds and tests without requiring any key

#### Scenario: Duplicate slug rejected

- **WHEN** the user submits the create dialog with slug `ollama-local`, which already exists
- **THEN** the API responds 409, the dialog stays open, and an inline error on the slug field explains the slug is taken

#### Scenario: Created provider with unset key is diagnosable

- **WHEN** the user creates a keyed provider but has not yet added the variable's value to the environment, then clicks Test
- **THEN** the test reports `ok: false` naming the missing variable, guiding the remaining setup step

### Requirement: Provider configuration

Each provider card SHALL offer a "Configure" action opening a dialog with: a connection section — base URL (required) and API key environment-variable name (optional; clearing it SHALL persist as null, name-only per the secrets policy); a default-model selector populated from the live model list (filter-as-you-type, with free-text entry allowed so an unavailable list or a not-yet-pulled model never blocks configuration); and a per-pipeline overrides editor showing one row per pipeline (`normalize`, `tag`, `match`, `cover_letter`) with an optional model and an optional temperature (0–2); blank override fields SHALL mean "inherit the default model / pipeline default" and SHALL be omitted from the saved object. Saving SHALL call `PATCH /v1/llm/providers/{slug}` (gateway → LLM service `PATCH /providers/{slug}`) with any of `default_model`, `pipeline_overrides`, `base_url`, `api_key_env`; the submitted `pipeline_overrides` object SHALL replace the stored one wholesale. The server SHALL reject unknown pipeline names, out-of-range temperatures, and empty `base_url`/`default_model` values with 400, and unknown slugs with 404. Slug and kind SHALL NOT be editable. On success the provider list SHALL refresh and a toast SHALL confirm.

#### Scenario: Changing the default model

- **WHEN** the user opens Configure on a provider, picks a model from the live list, and saves
- **THEN** the PATCH persists `default_model`, the dialog closes, and the card shows the new model

#### Scenario: Fixing a provider's base URL

- **WHEN** the user corrects a provider's base URL in the connection section and saves
- **THEN** the PATCH persists `base_url` and a subsequent Test probes the corrected endpoint

#### Scenario: Clearing the API key requirement

- **WHEN** the user clears the API key environment-variable field and saves
- **THEN** `api_key_env` persists as null and the provider's adapter builds without requiring a key

#### Scenario: Setting a pipeline override

- **WHEN** the user sets `cover_letter` to a different model with temperature 0.7 and saves
- **THEN** the stored `pipeline_overrides` contains exactly that entry and subsequent `cover_letter` runs resolve to it

#### Scenario: Clearing an override

- **WHEN** the user blanks out a pipeline's override fields and saves
- **THEN** the saved `pipeline_overrides` omits that pipeline and its runs fall back to the default model

#### Scenario: Invalid override rejected

- **WHEN** a PATCH arrives with an unknown pipeline key or a temperature outside 0–2
- **THEN** the server responds 400 and nothing is persisted

### Requirement: Configuration hot-reload

A successful `PATCH /providers/{slug}` SHALL broadcast `NOTIFY llm_config_changed` (in the same connection as the UPDATE) and invalidate the local resolver cache, so running workers pick up the new model/overrides on their next pipeline call without a restart — the same guarantee the active-provider switch already provides.

#### Scenario: Running worker picks up a model change

- **WHEN** a provider's default model is changed while the service is running
- **THEN** the next pipeline call resolves the new model without any process restart
