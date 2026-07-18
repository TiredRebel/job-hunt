# Proposal: llm-provider-delete-and-model-picker

## Why

The Configure dialog's model selector is effectively unusable — clicking a
suggested model does not apply it, the dropdown can't be browsed while a value
is already saved (the list is filtered by the saved value, hiding everything
else), and a default model that doesn't exist on the provider at all
(`ollama-local`'s `qwen3.5:9b`) was silently accepted and persisted with no
warning. Separately, providers can never be removed — there is no delete
endpoint by design-so-far — which has already left a real `groq-test` debris
row from manual verification stuck in the DB.

## What Changes

- **Fix the model combobox** (`ModelCombobox` in
  `provider-config-dialog.tsx`): selection from the dropdown must actually
  apply the clicked model and close the popover; opening the dropdown with a
  saved value must show the full model list (current value highlighted), not a
  list filtered down by the saved value; filtering must only track what the
  user actively types as a search, decoupled from the stored value.
- **Surface stale/unknown models**: when the live model list for the provider
  loaded successfully and the current default model is not in it, the dialog
  shows a visible warning (free-text entry remains allowed per the existing
  requirement — an absent list or not-yet-pulled model must not block
  configuration).
- **Provider deletion**: new `DELETE /providers/{slug}` on the LLM service and
  `DELETE /v1/llm/providers/{slug}` on the gateway; a "Delete" button (with
  confirmation) in the Configure dialog. Deleting the **active** provider is
  rejected with 409 and the button is disabled for it with a hint to switch
  first. Unknown slug → 404.
- **Cleanup of live debris using the new features** (verification steps, not
  code): delete the `groq-test` row via the new Delete button; fix
  `ollama-local`'s default model to a genuinely installed model via the fixed
  dropdown.

## Capabilities

### New Capabilities

<!-- none — everything extends the existing llm-admin-ui capability -->

### Modified Capabilities

- `llm-admin-ui`:
  - **Provider configuration** (modified): the default-model /
    override-model selector's behavior is specified more precisely —
    browsable full list on open, click-to-select applies and closes,
    search-as-you-type decoupled from the saved value, and a
    not-in-list warning when a live list is available. Free text stays.
  - **Provider deletion** (added): new requirement — delete a non-active
    provider from the Configure dialog with confirmation; active provider
    deletion is blocked (409 / disabled button).

## Impact

- `services/llm`: `routes.py` (new DELETE route), `db.py` (new
  `delete_provider`), tests. No `NOTIFY` needed (deleting a non-active row
  can't affect the resolver cache's active provider).
- `apps/api`: `llm-admin` module (controller/service/DTOs + `LlmServiceError`
  mapping for 404/409), OpenAPI regeneration, tests.
- `packages/shared-ts`: regenerated types for the new operation.
- `apps/web`: `provider-config-dialog.tsx` (combobox rewrite, warning, Delete
  button + confirm), `lib/api/llm.ts` (new `deleteLlmProvider`), tests.
- DB: removes rows only via the new endpoint at operator's request; no
  migration.
- No breaking API changes (purely additive endpoint + UI behavior fixes).
