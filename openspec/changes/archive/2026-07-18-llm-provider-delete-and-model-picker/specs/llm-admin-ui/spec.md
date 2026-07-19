# llm-admin-ui (delta)

## MODIFIED Requirements

### Requirement: Provider configuration

Each provider card SHALL offer a "Configure" action opening a dialog with: a connection section — base URL (required) and API key environment-variable name (optional; clearing it SHALL persist as null, name-only per the secrets policy); a default-model selector populated from the live model list; and a per-pipeline overrides editor showing one row per pipeline (`normalize`, `tag`, `match`, `cover_letter`) with an optional model and an optional temperature (0–2); blank override fields SHALL mean "inherit the default model / pipeline default" and SHALL be omitted from the saved object. Saving SHALL call `PATCH /v1/llm/providers/{slug}` (gateway → LLM service `PATCH /providers/{slug}`) with any of `default_model`, `pipeline_overrides`, `base_url`, `api_key_env`; the submitted `pipeline_overrides` object SHALL replace the stored one wholesale. The server SHALL reject unknown pipeline names, out-of-range temperatures, and empty `base_url`/`default_model` values with 400, and unknown slugs with 404. Slug and kind SHALL NOT be editable. On success the provider list SHALL refresh and a toast SHALL confirm.

The model selector (default model and each override row) SHALL behave as a browsable combobox: opening it SHALL show the full fetched model list regardless of the currently saved value, with the current selection visibly marked; filtering SHALL track only the search text the user types after opening, never the stored value; choosing a listed model SHALL apply it and close the dropdown on the first activation (click or keyboard). Free-text entry SHALL remain possible so an unavailable model list or a not-yet-pulled model never blocks configuration: search text that matches no listed model SHALL be applicable as-is via an explicit action in the dropdown. Each override row SHALL additionally offer an explicit "inherit" action that clears the override back to blank. When the model list for the provider was fetched successfully and the current default model is not among the listed models, the dialog SHALL show a visible warning naming the model; the warning SHALL NOT block saving.

#### Scenario: Changing the default model

- **WHEN** the user opens Configure on a provider, picks a model from the live list, and saves
- **THEN** the PATCH persists `default_model`, the dialog closes, and the card shows the new model

#### Scenario: Browsing the list with a value already saved

- **WHEN** the user opens the default-model dropdown on a provider whose saved model is `qwen3.5:9b`
- **THEN** the full fetched model list is shown (not a list filtered by `qwen3.5:9b`), and typing narrows it by the typed search only

#### Scenario: Selection applies on first click

- **WHEN** the user clicks a model in the open dropdown
- **THEN** that model becomes the field's value and the dropdown closes, without reopening on its own

#### Scenario: Free-text model still accepted

- **WHEN** the user types a model name that is not in the fetched list and applies it via the dropdown's explicit free-text action
- **THEN** the typed name becomes the field's value exactly as entered

#### Scenario: Warning for a default model missing from a live list

- **WHEN** the model list loaded successfully and the current default model is not among the listed models
- **THEN** the dialog shows a warning naming the model, and saving remains possible

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

- **WHEN** the user resets a pipeline's override to inherit via the dropdown's inherit action and blanks its temperature, then saves
- **THEN** the saved `pipeline_overrides` omits that pipeline and its runs fall back to the default model

#### Scenario: Invalid override rejected

- **WHEN** a PATCH arrives with an unknown pipeline key or a temperature outside 0–2
- **THEN** the server responds 400 and nothing is persisted

## ADDED Requirements

### Requirement: Provider deletion

The Configure dialog SHALL offer a "Delete" action for the provider being configured. Activating it SHALL ask for confirmation naming the provider slug before any request is made. Confirmed deletion SHALL call `DELETE /v1/llm/providers/{slug}` (gateway → LLM service `DELETE /providers/{slug}`), which SHALL permanently remove the provider row and respond 204. Deleting the **active** provider SHALL be rejected with 409, and the dialog SHALL render the Delete action disabled for the active provider with a hint to switch the active provider first. An unknown slug SHALL respond 404. Historical pipeline-run records SHALL survive the deletion. A successful deletion SHALL refresh the provider list, show a confirmation toast, and close the dialog; the active provider SHALL be unchanged by any deletion.

#### Scenario: Deleting a non-active provider

- **WHEN** the user opens Configure on the non-active `groq-test` provider, clicks Delete, and confirms
- **THEN** the API responds 204, the card disappears from the provider list, and the active provider is unchanged

#### Scenario: Cancelling at the confirmation

- **WHEN** the user clicks Delete but dismisses the confirmation
- **THEN** no request is made and the provider remains

#### Scenario: Active provider is protected

- **WHEN** the Configure dialog is open on the currently active provider
- **THEN** the Delete action is disabled with a hint to switch first, and a direct `DELETE /v1/llm/providers/{slug}` for it responds 409 without removing the row

#### Scenario: Unknown slug

- **WHEN** a `DELETE /v1/llm/providers/{slug}` arrives for a slug that does not exist
- **THEN** the response is 404
