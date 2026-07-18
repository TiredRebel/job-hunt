# Design: llm-provider-delete-and-model-picker

## Context

The Configure dialog (`apps/web/src/components/llm/provider-config-dialog.tsx`)
renders five `ModelCombobox` instances (default model + four pipeline
overrides). The current implementation wraps a plain `Input` in a Radix
`PopoverTrigger` and drives filtering directly off the field's stored value:

- `onFocus={() => setOpen(true)}` + Radix returning focus to the trigger on
  close means selecting an item closes the popover, focus bounces back to the
  input, and the popover immediately reopens — selection appears to "not
  work" (user-confirmed bug 1).
- `filtered` is computed from `value` (the saved model), so opening the
  dropdown on a configured provider shows only entries containing the saved
  string — for `qwen3.5:9b` that's nothing, making the list unbrowsable
  without first clearing the field (user-confirmed bug 2).
- Free text is accepted unconditionally with no feedback, so a model name
  that the provider doesn't actually have (`qwen3.5:9b` is not in
  `ollama-local`'s live list) was persisted silently (user-confirmed bug 3).

Deletion does not exist anywhere in the stack: no `DELETE` route on the LLM
service (`services/llm/src/llm/routes.py` has GET/PUT/POST/PATCH only), no
gateway proxy, no UI. This was a deliberate non-goal of `llm-settings-config`
(see its proposal) — revisited now because real debris (`groq-test`) is stuck.

Constraints inherited from the codebase:

- The `llm-admin-ui` spec requires free-text model entry to stay possible
  (an unreachable list or not-yet-pulled model must never block config).
- No component-rendering tests exist for any web admin page (repo-wide
  convention) — client-layer tests only; UI behavior is verified by live
  browser smoke.
- Existing confirm pattern on this page is `window.confirm`
  (`provider-card.tsx` uses it for the active-provider switch).
- Gateway error mapping goes through `LlmServiceError`
  (404→NotFound, 409→Conflict, 400/422→BadRequest, else→BadGateway).

## Goals / Non-Goals

**Goals:**

- Model selection from the dropdown works on the first click and the popover
  closes.
- Opening the dropdown always shows the full fetched list (bounded by the
  existing `MAX_MODEL_SUGGESTIONS`), with the currently-set model visibly
  marked; filtering happens only as the user types a search.
- The dialog warns when the saved/entered default model is not present in a
  successfully fetched model list (without blocking save).
- A non-active provider can be deleted end to end (LLM service → gateway →
  UI button with confirmation); the active provider cannot.
- The `groq-test` debris row gets removed and `ollama-local`'s default model
  gets corrected — via the new/fixed UI itself, as live verification.

**Non-Goals:**

- No strict select-only model field (free text stays, per spec).
- No cascade semantics: `core.llm_providers` has no dependent FK rows keyed
  by provider (pipeline runs reference provider by value, not FK) — delete is
  a single-row `DELETE`.
- No undo/soft-delete; deletion is permanent and confirmed beforehand.
- No changes to provider creation or the active-switch flow.
- No new UI primitives (no AlertDialog component; `window.confirm` is the
  established pattern here).

## Decisions

### D1 — Rebuild `ModelCombobox` as a canonical shadcn combobox (button trigger + `CommandInput`)

Replace the input-as-trigger design with the standard, known-good shadcn
pattern: a `Button`-style trigger (role `combobox`, shows the current value
or the inherit/placeholder text, chevron icon) opening a Popover containing
`Command` with its own `CommandInput` search field.

- **Search is separate state** that starts empty on every open → full list
  visible immediately, bugs 1 and 2 structurally impossible (no focus
  bounce-back loop: the trigger is a button, and cmdk's own input lives
  inside the content).
- The currently-set model renders with a check indicator.
- **Free text**: when the typed search matches no model exactly, the list
  shows an explicit "Use "<typed>"" item that applies the raw text. This
  keeps the spec's free-text guarantee while making "pick from the list" the
  primary path.
- **Override rows** additionally get an "(inherit default)" item that clears
  the override back to blank — previously done by clearing the input, which
  a button trigger can't do implicitly.

Alternative considered: keep the editable `Input` trigger and patch the focus
loop (`onMouseDown` preventDefault on items, open-on-pointerdown instead of
focus, decouple a `query` state). Rejected: it re-derives a fragile custom
widget from scratch when cmdk's canonical composition already solves
focus/keyboard/ARIA correctly; the free-text affordance ("Use …" item) is a
better trade than an always-editable field that silently accepts typos
(that's exactly bug 3).

### D2 — Not-in-list warning, not validation error

When `modelsQuery` succeeded (`error == null`, non-empty `models`) and the
current default model is not in the list, show a warning line under the
field (i18n key, amber/`text-warning` styling, same visual language as the
existing `modelsErrorHint`). Save stays enabled. Rationale: the spec
guarantees free text precisely because lists can be incomplete or stale;
the failure mode being fixed is _silence_, not permissiveness. Applies to
the default model only — override rows inherit legitimately from many
sources and warning on all five fields would be noise.

### D3 — `DELETE /providers/{slug}` on the LLM service; 409 guards the active row

- `db.py`: `delete_provider(slug) -> bool` — single `DELETE FROM
core.llm_providers WHERE slug = %s AND NOT is_active` returning whether a
  row was deleted; a preceding `get_provider` distinguishes 404 (no row)
  from 409 (row exists but active). Two queries, no transaction needed: the
  `AND NOT is_active` predicate makes the delete itself race-safe (a
  concurrent activation loses nothing — the delete simply affects 0 rows and
  maps to 409).
- Route: `DELETE /providers/{slug}` → 204 on success, 404 unknown slug,
  409 active provider. **No `NOTIFY llm_config_changed`**: the resolver
  cache only ever holds the active provider, and the active row cannot be
  deleted, so a delete can never invalidate it.
- Alternative considered: auto-activating another provider when deleting the
  active one. Rejected per user decision — blocking is simpler, predictable,
  and preserves the invariant "exactly one active provider" without magic.

### D4 — Gateway: standard proxy + existing `LlmServiceError` mapping

`DELETE /v1/llm/providers/:slug` on `LlmAdminController`, `@HttpCode(204)`;
service method calls the LLM service and lets the established
`LlmServiceError` mapping translate 404→NotFoundException and
409→ConflictException. OpenAPI + `packages/shared-ts` regenerated so the web
client gets a typed operation. No new patterns.

### D5 — UI: Delete lives in the Configure dialog, `window.confirm`, disabled for active

- Destructive-variant button on the left of the Configure dialog footer
  (Cancel/Save stay right). Clicking asks `window.confirm` (i18n message
  naming the slug) — consistent with the switch-confirm precedent.
- For the active provider the button renders disabled with a hint line
  (i18n) explaining to switch the active provider first — mirroring the
  409 the server would return, so the guard is visible before the request.
- On success: invalidate the providers query, toast, close the dialog.
  On 409/404 (races): error toast with the server-mapped message.

### D6 — Debris cleanup happens through the shipped feature, not SQL

Deleting `groq-test` and re-pointing `ollama-local.default_model` to an
installed model are the final verification tasks, performed against the live
Docker stack via the new Delete button and the fixed picker. This doubles as
the end-to-end proof (real 204 + row gone; real model list + selection
persisted) and leaves the DB clean without out-of-band SQL.

## Risks / Trade-offs

- [Combobox regression risk — five call sites replaced at once] → The new
  widget is the canonical cmdk composition (well-trodden), all five
  instances share one component, and the live browser smoke exercises both
  the default-model and an override field.
- [No component tests can pin the combobox behavior] → Accepted repo-wide
  convention; the client layer (`deleteLlmProvider`, error mapping) gets
  unit tests, UI behavior is covered by the live smoke checklist in
  tasks.md.
- [`window.confirm` is not styleable and blocks the thread] → Accepted for
  consistency with the existing switch confirm; replacing the page's confirm
  pattern wholesale is out of scope.
- [Deleting a provider referenced by historical `pipeline_runs` rows] →
  Verified against `infra/db/schema.sql` during design: `llm.pipeline_runs`
  stores `provider_slug text NOT NULL` by value with no FK to
  `core.llm_providers`, so history survives deletion unchanged.
- [Trigger button can't show mid-edit free text] → Free text is entered via
  the search field and applied explicitly; the trigger then shows it. Slightly
  more clicks than a raw input; deliberate (see D1).

## Migration Plan

Purely additive endpoint + client behavior change: deploy in any order
(gateway before web is harmless; web's Delete button 404s gracefully if the
gateway is stale). Rollback = revert the commit. No DB migration.

## Open Questions

- None blocking. (If `pipeline_runs` turns out to FK `llm_providers` after
  all, D3 gains an `ON DELETE` decision — task 1.1 checks the schema first
  and escalates if so.)
