# Design: sources-page-crud

## Context

Current state (verified against code, not docs):

- **DB** — `core.sources`: `id smallserial`, `slug text UNIQUE`, `name`, `base_url`, `enabled`, `fetch_strategy` (CHECK `api | crawl4ai | agent-browser`), `config jsonb`, timestamps + `updated_at` trigger. Every field the feature needs already exists; **no migration**.
- **Gateway** (`apps/api/src/sources/`) — clean-architecture module: controller → `SourcesService` → `SOURCE_REPOSITORY` port (`findAll/findBySlug/setEnabled/findRuns`) implemented by `postgres-source.repository.ts`, plus the `SCRAPER_CLIENT` port (`triggerScrape/listUnprocessed/markProcessed`) implemented by `http-scraper.client.ts` (fetch + `X-Internal-Token`).
- **Scraper** (`services/scraper`) — adapters are a hard-coded slug→factory map (`registry._FACTORIES`, 5 entries; `registry.known_slugs()` already exists). `POST /scrape/{slug}` 404s via `UnknownSourceError` for anything else. All transports share one `PolitenessGate` (robots + per-host pacing); `build_fetcher_factory` resolves `fetch_strategy` → fetcher and raises `UnsupportedStrategyError` when e.g. crawl4ai isn't installed.
- **Web** (`apps/web/src/components/sources/sources-page.tsx`) — card-per-source list (not a `<Table>`; "above/below the table" maps to above/below this list), TanStack Query + `lib/api/sources.ts`, sonner toasts, EN/UK catalogs in `apps/web/messages/`. `Dialog` primitive already exists in `components/ui/dialog.tsx`. The llm-admin page already establishes a "Test connection" UX pattern to stay consistent with.

Constraint that shapes everything: **creating a source row does not make it scrapeable** — only slugs with a registered adapter can scrape. The UI must make that state visible instead of letting users discover it as a scrape-time 404.

## Goals / Non-Goals

**Goals:**

- Create and edit `core.sources` rows entirely from the `/sources` page.
- Per-source connectivity test that exercises the _real_ fetch path (same adapter registry, same fetcher ladder, same politeness gate) without persisting anything.
- Honest adapter-status surfacing: a source without an adapter is legal config but visibly "not scrapeable yet".
- Keep the existing module boundaries: gateway owns `core.*` writes; scraper owns fetching; web talks only to the gateway.

**Non-Goals:**

- Deleting sources (FK/cascade semantics on `core.jobs.source_id` → separate change).
- A schedule editor beyond editing `config` JSON (n8n scheduler just reads `config.cron`).
- New scraper adapters, or a plugin/dynamic adapter mechanism.
- Auth on the new gateway endpoints (the dashboard API is unauthenticated today; consistent with every existing mutating endpoint, e.g. `PATCH /sources/{slug}/enabled`).

## Decisions

### D1 — Test lives on the scraper, proxied by the gateway

`POST /v1/sources/{slug}/test` (gateway) → `POST /sources/{slug}/test` (scraper). The scraper is the only place the adapter registry, fetcher ladder, and politeness gate exist, so a test anywhere else would be a lie (a plain gateway-side `fetch(base_url)` would ignore robots, UA, per-host pacing, JS-shell escalation, and anti-bot detection). Response shape (scraper, snake_case → gateway camelCase):

```json
{ "status": "ok" | "no_adapter" | "unsupported_strategy" | "blocked" | "failed",
  "detail": "human-readable reason", "httpStatus": 200 | null, "elapsedMs": 412 | null }
```

Semantics: `no_adapter` — slug not in `known_slugs()`; `unsupported_strategy` — `UnsupportedStrategyError` (e.g. crawl4ai missing); `blocked` — `FetchBlockedError` (robots or anti-bot interstitial; **never** escalated, same rule as scraping); `failed` — network error / non-2xx; `ok` — one polite fetch of the adapter's listing URL succeeded. The test writes nothing (no run row, no `jobs_raw`). The gateway returns 200 with the payload for _all_ outcomes — a failing test is a successful test-execution; 502 is reserved for "couldn't reach the scraper service itself". Alternative considered: reuse `POST /scrape/{slug}` with a dry-run flag — rejected, it schedules background work and creates run rows; test must be synchronous and side-effect-free.

The adapter needs to expose _what URL to test_: add a small `probe_url(config) -> str` classmethod/attribute convention on adapters (default: the listing URL each adapter already builds; fall back to `base_url` from the row). Keep it minimal — no `discover()` dry-run (heavier, pagination-dependent, and politeness cost for zero extra signal).

### D2 — Slug is immutable after create

Slug is the adapter-registry key, the n8n scheduler's identifier, and the natural key used by every existing endpoint. Renaming would silently orphan the adapter binding. Create accepts slug; `PATCH /v1/sources/{slug}` accepts only `name`, `baseUrl`, `fetchStrategy`, `config`, `enabled`. (Enabled stays also available via the existing dedicated `PATCH .../enabled` — the switch keeps using it; the edit form uses the general PATCH.)

### D3 — Adapter awareness via `GET /adapters`, fetched separately

Scraper adds `GET /adapters` → `{"slugs": ["dou", ...]}` (one line: `registry.known_slugs()`). Gateway proxies as `GET /v1/sources/adapters` (**declared before** the `GET /sources/:slug` route so `adapters` isn't captured as a slug). The web page fetches it as its own query and renders a "No adapter" badge on non-matching rows + a warning inside the create form. Alternative considered: embed `hasAdapter` per row in `GET /v1/sources` — rejected because it would couple listing sources (a pure DB read) to scraper availability; with a separate query the page degrades gracefully (badge simply not shown) when the scraper is down.

### D4 — Config edited as raw JSON text

The `config` JSONB is adapter-specific and open-ended (subreddits, list URLs, cron hints…). The form exposes it as a `Textarea` with client-side `JSON.parse` validation (inline error, submit disabled on invalid JSON) rather than inventing a per-adapter schema UI. Server-side, the DTO validates it is a JSON **object** (not array/scalar).

### D5 — One dialog component for create and edit

Single `SourceFormDialog` (shadcn `Dialog`) with mode `create | edit`; edit pre-fills and disables the slug field. Both "Add source" buttons (above and below the list) open the same dialog. Mutations invalidate `queryKeys.sources.all`. Validation mirrors the DTOs: slug `^[a-z0-9-]+$`, name non-empty, baseUrl `z.string().url()`-equivalent check, fetchStrategy from the 3-value enum (Select), config valid JSON object. API errors map: 409 (duplicate slug) → inline field error; 400 → toast with server message.

### D6 — Test UX is per-row inline state, not a toast

Clicking Test disables that row's flask icon, shows a spinner, then renders the outcome as a small inline status (`ok` green with elapsed ms / others warning-tinted with the `detail` text) that persists until the next test or page refresh. Toast-only feedback (like Run now uses) is wrong here because the detail text is the entire point of the feature. Follows the llm-admin "Test connection" precedent.

### D7 — Repository/port extensions, not a new module

`SourceRepository` gains `create(input)` and `update(slug, patch)` (returning `Source | null`, `null` → 404; unique-violation `23505` → `ConflictException`). `ScraperClient` gains `testSource(slug)` and `listAdapters()`. No new NestJS module — this is still the sources capability.

## Risks / Trade-offs

- [Test endpoint can be slow — polite fetch of a real site can take seconds] → synchronous by design but bounded: scraper wraps the fetch in the existing request timeout (`SCRAPER_REQUEST_TIMEOUT_SECONDS`, 30s default); web shows a spinner and keeps the row usable; gateway `fetch` inherits Node's default timeout which exceeds the scraper's, so the scraper always answers first.
- [Testing a source still consumes a real request against the target site] → acceptable: it goes through the politeness gate (per-host pacing) exactly like a scrape; the button is manual, not polled.
- [Free-form config JSON lets users break an adapter's expectations] → adapters already treat config defensively (missing keys → defaults); test button gives immediate feedback; this is a personal tool, not multi-tenant.
- [Creating a source with no adapter may still confuse] → mitigated three ways: form warning at create time, persistent row badge, and `POST /scrape` already 404s with a clear message. Trade-off accepted over blocking creation entirely — rows-before-adapters is a legitimate workflow (config prepared ahead of an adapter shipping).
- [`GET /sources/adapters` route shadowing `:slug`] → explicit decision (D3) to register the static route first; covered by a controller test.
- [No auth on new mutating endpoints] → consistent with the existing surface; hardening the dashboard API wholesale is Phase 7 scope, not this change.

## Migration Plan

No DB migration. Deploy order-insensitive within one release: scraper first (new endpoints are additive), then gateway, then web. Rollback = revert; nothing persisted in a new shape. OpenAPI: `npm run openapi:emit -w apps/api` → `npm run generate -w packages/shared-ts` → commit both.

## Open Questions

_None blocking. If `probe_url` turns out awkward for the Reddit adapter (API-strategy, listing URL is per-subreddit), fall back to testing the first configured subreddit's JSON URL — decide during implementation, it's an adapter-internal detail._
