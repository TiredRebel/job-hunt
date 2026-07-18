---
updated: 2026-07-18
sources:
  [
    ../../PROGRESS.md,
    ../../openspec/changes/llm-provider-delete-and-model-picker/tasks.md,
    ../../openspec/changes/llm-settings-config/tasks.md,
    ../../docs/LLM_CONFIG.md,
    ../../docs/DEPLOYMENT.md,
    ../../apps/web/src/app/api/[...path]/route.ts,
  ]
---

<!-- checkpoint: llm-provider-delete-and-model-picker implemented + verified live (real 204/409/404 delete, model combobox rebuilt, groq-test cleaned up); same-origin /api proxy + raw_html/TagsInput fixes from the prior round still uncommitted; llm-settings-config still not archived -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-18)

- **`llm-provider-delete-and-model-picker`** (OpenSpec change, fully
  implemented, uncommitted): user-reported bug in the LLM Settings Configure
  dialog — clicking a model in the dropdown didn't apply it, the list was
  unbrowsable once a value was saved, and an unlisted default model was
  accepted silently. Also added provider deletion (previously impossible by
  design, leaving the `groq-test` debris row stuck). See `PROGRESS.md`'s
  2026-07-18 (second) log entry for full detail. Summary:
  1. `DELETE /providers/{slug}` end to end (LLM service → gateway →
     `deleteLlmProvider` client) — 404 unknown slug, 409 active provider
     (no `NOTIFY` needed, the resolver cache can't hold a deletable row).
  2. `ModelCombobox` rebuilt as the canonical shadcn/cmdk button-trigger +
     popover-search combobox — the old input-as-trigger design caused focus
     to bounce back and reopen the dropdown on selection (the actual click
     bug), and filtered by the _saved_ value instead of the typed search
     (the unbrowsable-list bug). Free text still works via an explicit
     "Use …" item; override rows gained an explicit "inherit" item.
  3. A visible warning when the default model isn't in a successfully
     fetched model list.
  - Gates green throughout (see PROGRESS.md for exact counts). Docker stack
    rebuilt and redeployed. **Not committed yet.**
  - Verified live via curl (same Chrome-unavailable limitation as the prior
    round — see below): real `204`/`409`/`404` on delete (including tracing
    a fresh throwaway provider's delete with `-v` to see the literal `204
No Content`), a real free-text pipeline-override round-trip, and
    cleanup — the actual `groq-test` row is gone from the live DB.
  - **Correction found during verification**: `ollama-local`'s default
    model (`qwen3.5:9b`) is a real, currently-installed Ollama model (a live
    `GET .../models` call confirmed it) — the proposal's assumption that it
    was stale/broken data was wrong. No default-model change was made;
    don't assume it still needs "fixing" in a future session.
  - The combobox's click-to-select/browsability fix itself could not be
    interactively verified (no browser in this environment) — verified by
    code review + full gates + live-checked data-layer dependencies
    (model fetch, PATCH persistence, free-text round-trip) instead.

- **Live-smoke bugfix round** (uncommitted, prior to the above): three real bugs found and
  fixed while smoke-testing the running stack, on top of the 2026-07-17
  `llm-settings-config` checkpoint below. See `PROGRESS.md`'s 2026-07-18 log
  entry for full detail. Summary:
  1. Browser Client Components now reach the gateway through a same-origin
     `apps/web/src/app/api/[...path]/route.ts` proxy instead of a direct
     cross-origin fetch — `NEXT_PUBLIC_API_URL` is an optional override,
     `WEB_ORIGIN` is now comma-separated. Verified live via curl (GET plus a
     real POST test-connectivity call), byte-identical to hitting the
     gateway directly.
  2. `scraper/adapters/_html.py::build_posting()` was putting full raw page
     HTML into `raw_html` instead of the already-extracted description
     text — fixed, test updated.
  3. `TagsInput` didn't forward `id`, breaking the Profile page's
     `Label htmlFor="skills"` association — fixed.
  - All gates green (scraper/llm/api/web — see PROGRESS.md). Docker stack
    rebuilt and redeployed with the fixes live. **Not committed yet.**
  - Real browser automation (Playwright/chrome-devtools MCP) was
    unavailable in this environment (no reachable Chrome binary) — the
    CORS/proxy fix was verified via curl issuing the same requests a
    browser would, not an actual browser session. If that tooling becomes
    available, a real browser pass on `/sources`, `/dictionaries`,
    `/profile`, `/settings/llm` would still be worth doing once.

- **Phases 0–6:** complete (see prior checkpoints / `PROGRESS.md`).
- **Full Docker stack now actually runs**, not just documented: `Dockerfile`
  for all four services (`services/llm`, `services/scraper`, `apps/api`,
  `apps/web`), `infra/docker-compose.yml` extended with `api`/`web` +
  `restart: unless-stopped` everywhere, `.github/workflows/ci.yml` added.
  `docs/DEPLOYMENT.md` is the install/config/deploy guide — read it before
  assuming any deployment step "just works"; it documents real gaps found
  while writing it (and several were fixed on the spot, see `PROGRESS.md`'s
  log for the exact list — stale `next` version, `.dockerignore` not
  matching at depth, Compose's `.env` lookup directory, missing
  `app.enableCors()` on the gateway).
- **`sources-page-crud`** (ad-hoc OpenSpec change, not a numbered phase):
  the `/sources` page gained real CRUD — Add source, per-row Edit, per-row
  Test (a real, side-effect-free connectivity check that exercises the
  actual adapter + fetcher + politeness gate), and a "No adapter" badge for
  sources whose slug has no registered scraper adapter. Implemented and
  **verified against the live Docker stack with real browser automation and
  real network calls** (not mocked) — see the 2026-07-17 log entries in
  `PROGRESS.md` for exact outcomes (a live `dou` fetch, a real `djinni`
  source created and shown with its badge, a genuine `410 Gone` from
  Upwork's now-dead legacy RSS feed proving the `failed` path). **Archived**
  to `openspec/changes/archive/2026-07-17-sources-page-crud/` (move
  performed, not yet committed to git).
  - Left in the DB from manual verification: a real `djinni` source row
    (crawl4ai strategy, no adapter). Harmless — sources have no delete
    endpoint by design (see the change's design.md non-goals) — but if a
    pristine seed state matters, remove it via SQL.
- **`llm-settings-config`** (ad-hoc OpenSpec change, not a numbered phase):
  the "LLM settings" page's "Test connection" button used to be fake — it
  only checked the LLM service's own `/health`, never the actual provider.
  Now real: `POST /providers/{slug}/test` builds the adapter for that row
  and probes it, on **every** card, not just the active one. Also new: live
  model lists (`GET /providers/{slug}/models`, cmdk combobox with free-text
  fallback), **Add provider** (create a new row — `slug`/`kind` permanent,
  `base_url`/`default_model` mandatory, `api_key_env` optional — always
  created inactive), and a **Configure** dialog for base URL / key env-var
  name / default model / per-pipeline overrides via `PATCH
/providers/{slug}` (replace-not-merge overrides, explicit-`null`-clears
  `api_key_env`). **Breaking**: the old `POST
/v1/llm/providers/test-connection` endpoint is gone (confirmed unused by
  any n8n workflow before removal). All 5 task groups implemented and
  gated green (services/llm: 57 pytest + ruff + mypy --strict; apps/api: 99
  vitest + typecheck + lint + build; packages/shared-ts regenerated;
  apps/web: 53 vitest + typecheck + lint + build) and **verified live**
  against the rebuilt Docker stack with real browser automation — genuine
  `ConnectError`/`HTTPStatusError`(401 from real Groq API)/missing-key/`ok:
true` outcomes all observed, plus a raw `curl PATCH` proving the
  omitted-vs-explicit-null `apiKeyEnv` distinction survives NestJS's
  `ValidationPipe`. Not yet archived —
  `openspec/changes/llm-settings-config/` still has its planning artifacts
  in place; run `/opsx:archive llm-settings-config` when ready.
  - The `groq-test` debris row mentioned here has since been deleted for
    real via `llm-provider-delete-and-model-picker`'s new delete endpoint
    (2026-07-18) — providers are no longer delete-less by design; that
    limitation from this change's non-goals is now lifted.
  - `ollama-local`'s `base_url` was updated live to
    `http://host.docker.internal:11434` (was `http://localhost:11434`,
    unreachable from inside the `llm` container) — this is a genuine fix,
    not test debris; see docs/DEPLOYMENT.md §8.1.

## Next up

- Commit both uncommitted rounds (2026-07-18 live-smoke bugfix round +
  `llm-provider-delete-and-model-picker`) — not committed yet because it
  wasn't explicitly requested.
- Archive `llm-provider-delete-and-model-picker` once committed (sync its
  delta spec into `openspec/specs/llm-admin-ui/spec.md`).
- If real browser automation becomes available in this environment
  (currently no reachable Chrome binary, confirmed via a failed `playwright
install chrome`/`chromium` attempt — Chrome exists only on the Windows
  host side of this WSL setup), do one live pass on `/sources`,
  `/dictionaries`, `/profile`, `/settings/llm` covering: no console/CORS
  errors from the `/api` proxy, the Profile skills-label click-to-focus
  fix, and — most importantly — the rebuilt model combobox's actual
  click-to-select/browse behavior, which has only ever been verified by
  code review + gates, never interactively.
- Archive `llm-settings-config` (sync its delta spec into
  `openspec/specs/llm-admin-ui/spec.md`).
- Phase 7 — hardening (coverage gates, structured logging/correlation ids,
  rate-limiting audit, error budget/retries). The CI-pipeline and
  Docker-image bullets of Phase 7 are now done; the rest is still open.

## In-flight / open threads

- **agent-browser's CLI contract is unverified** — before relying on
  `agent-browser`-strategy scraping for real, install it locally
  (`npm i -g agent-browser && agent-browser install`), run `agent-browser
skills get core --full` to get the authoritative command reference, and
  adjust `SCRAPER_AGENT_BROWSER_CMD` / the output-parsing logic in
  `agent_browser.py` if the real contract differs from the `read [url]`
  guess.
- **Live end-to-end smoke of the n8n workflows is still an operator step**:
  no Telegram bot / SMTP credentials exist yet. See `n8n/README.md`
  "Verifying end to end".
- Redis/arq queue handoff between scraper and llm (ARCHITECTURE.md mentions
  it) was explicitly **not** built for Phase 6 — the processing chain polls
  the gateway instead; revisit under Phase 7 if scale demands it.
- Dictionary enable is **per-dictionary** (API has no per-item enabled flag).
- Playwright e2e needs live API + seeded jobs for full happy path; not run
  as part of CI yet (deliberately — see `docs/DEPLOYMENT.md` §10.1).
- No HTTP-level route-order test exists for `GET /sources/adapters` vs
  `GET /sources/:slug` (verified by code reading instead) — this repo has
  no supertest/e2e-controller harness yet; introduce one if a second
  same-verb route-ordering case ever comes up.
- No component-rendering tests exist for any web admin page (Sources,
  Dictionaries, Profile, LLM Settings) — only `lib/api/*` client-layer
  tests. A real gap, consistent across the whole app, not specific to any
  one feature.

## Resume commands

```powershell
cd E:\job-hunter
npm install
cd services\llm; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd services\scraper; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd apps\api; npm run typecheck; npm run lint; npm run test; npm run build; cd ..\..
cd packages\shared-ts; npm run typecheck; npm run lint; npm run build; cd ..\..
cd apps\web
npm run typecheck; npm run lint; npm run test; npm run build
# e2e (optional — needs API on :4000 + seed):
npm run test:e2e:install
npm run test:e2e
cd ..\..
cat PROGRESS.md

# Or bring up the full stack via Docker (see docs/DEPLOYMENT.md):
docker compose -f infra/docker-compose.yml --profile services up -d --build
```
