# Tasks: llm-provider-delete-and-model-picker

## 1. LLM service — delete endpoint (`services/llm`)

- [x] 1.1 `db.py`: add `delete_provider(slug: str) -> bool` executing
      `DELETE FROM core.llm_providers WHERE slug = %s AND NOT is_active`
      and returning whether a row was deleted (design D3 — the predicate
      makes the delete race-safe against a concurrent activation).
- [x] 1.2 `routes.py`: add `DELETE /providers/{slug}` → `get_provider`
      first: no row → 404; row with `is_active` → 409 (detail explains the
      active provider cannot be deleted); otherwise `delete_provider` →
      204 empty response (a `False` return after the active check also maps
      to 409 — the row was activated between the two statements). No
      `NOTIFY` (D3: the resolver cache only holds the active provider,
      which is undeletable).
- [x] 1.3 Tests (pytest, existing route-test style): 204 removes the row
      (subsequent GET of providers no longer lists it); 404 for unknown
      slug; 409 for the active provider with the row still present; 409 on
      the race path (delete returns `False` for a just-activated row,
      exercised by monkeypatching `delete_provider`).
- [x] 1.4 Gates green: `uv run pytest -q`, `uv run ruff check .`,
      `uv run ruff format --check .`, `uv run mypy --strict src`.

## 2. Gateway — proxy route (`apps/api` + `packages/shared-ts`)

- [x] 2.1 `llm-admin.service.ts`: add `deleteProvider(slug)` calling the LLM
      service `DELETE /providers/{slug}`, reusing the established
      `LlmServiceError` mapping (404→NotFoundException, 409→ConflictException,
      else→BadGateway). (`raiseFor` gained an optional conflict-message
      override, since the default "already exists" wording only fits
      creation.)
- [x] 2.2 `llm-admin.controller.ts`: add `@Delete('providers/:slug')` with
      `@HttpCode(204)` and OpenAPI annotations consistent with the module's
      existing routes.
- [x] 2.3 Tests (vitest, existing service-spec style): success passes the
      slug through and resolves; 404/409/5xx from the LLM service map to the
      right Nest exceptions.
- [x] 2.4 Regenerate OpenAPI + `packages/shared-ts`; gates green in both
      packages: `npm run typecheck`, `npm run lint`, `npm run test`
      (api), `npm run build`.

## 3. Web — model combobox rebuild + warning + Delete (`apps/web`)

- [x] 3.1 Rebuild `ModelCombobox` in `provider-config-dialog.tsx` as the
      canonical shadcn combobox (design D1): `Button` trigger
      (role=combobox, shows current value or placeholder, chevron),
      Popover containing `Command` + `CommandInput`; search state local to
      the popover and reset on open; the currently-selected model rendered
      with a check indicator; selecting an item applies it and closes.
- [x] 3.2 Free-text path: when the typed search exactly matches no listed
      model, render an explicit "Use "<typed>"" `CommandItem` that applies
      the raw text (spec: free text must never be blocked).
- [x] 3.3 Inherit path for override rows: an "(inherit default)" item (shown
      only in override mode) clears the override to blank; the trigger shows
      the inherit placeholder when blank.
- [x] 3.4 Not-in-list warning (design D2): when the models query succeeded
      with a non-empty list and `form.defaultModel` is not in it, render a
      warning line under the default-model field naming the model
      (`text-warning`, same visual language as `modelsErrorHint`). Default
      model only, save not blocked.
- [x] 3.5 `lib/api/llm.ts`: add `deleteLlmProvider(slug)` calling the typed
      DELETE operation; unit tests in the existing `llm.spec.ts` style
      (success + error propagation).
- [x] 3.6 Delete button in the Configure dialog (design D5):
      destructive-variant button on the footer's left; `window.confirm`
      naming the slug (switch-confirm precedent); on confirm → mutation →
      invalidate providers query → success toast → close dialog; error toast
      on failure. For `provider.isActive`: button disabled + hint line
      explaining to switch the active provider first.
- [x] 3.7 i18n: add all new keys (combobox search placeholder, free-text
      item, inherit item, not-in-list warning, delete button/confirm/hints/
      toasts) to both `en` and `uk` message catalogs.
- [x] 3.8 Gates green: `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run build`.

## 4. Live verification against the Docker stack (design D6)

- [x] 4.1 Rebuild and redeploy:
      `docker compose -f infra/docker-compose.yml --profile services up -d --build`.
- [x] 4.2 Combobox smoke — **not interactively verifiable**: no reachable
      Chrome binary in this environment (`playwright install chrome`/
      `chromium` attempted; Chrome exists only on the Windows host side of
      this WSL setup). Verified instead by code review, full gates, and
      live-checking the combobox's data-layer dependencies (model list
      fetch via `GET .../models`, PATCH persistence, free-text round-trip —
      see 4.6).
- [x] 4.3 Fix real data — **not needed**: live `GET .../models` showed
      `ollama-local`'s default model (`qwen3.5:9b`) is a real, currently
      installed Ollama model. The proposal's "stale default model"
      assumption did not hold; no change made.
- [x] 4.4 Delete smoke: deleted the real `groq-test` debris row via
      `DELETE /v1/llm/providers/groq-test` (confirmed gone via a direct
      gateway `GET`); separately traced a fresh throwaway provider's delete
      with `curl -v` to see the literal `204 No Content`.
- [x] 4.5 Guard smoke: `DELETE` on the active provider (`ollama-local`) →
      real `409` (`"Cannot delete the active provider 'ollama-local'"`)
      with the row surviving; `DELETE` on an unknown slug → real `404`.
- [x] 4.6 Free-text smoke: `PATCH`ed a genuinely unlisted model
      (`totally-unlisted-free-text-model`) onto the `cover_letter` pipeline
      override, confirmed the round-trip via `GET`, then reset it back to
      `{}` — no debris left.
- [x] 4.7 Updated `PROGRESS.md` (dated log entry) and the wiki checkpoint
      (`wiki/pages/current-state.md` + `wiki/log.md`).
