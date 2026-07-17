# Proposal: sources-page-crud

## Why

The `/sources` page is read-mostly today: sources can be enabled/disabled and scraped, but the five rows seeded by `infra/db/seed.sql` are the only way sources exist — there is no way to add a source, correct a base URL / fetch strategy / config from the UI, or check that a source is actually reachable before burning a scheduled scrape run on it. Every configuration tweak currently means hand-written SQL against `core.sources`.

## What Changes

- **Add source**: "Add source" buttons above and below the sources list open a create form (slug, name, base URL, fetch strategy, config JSON, enabled). New gateway endpoint `POST /v1/sources` inserts into `core.sources`.
- **Edit source**: an "Edit" icon on each source row opens the same form pre-filled (slug immutable — it is the adapter registry key). New gateway endpoint `PATCH /v1/sources/{slug}` updates name / base URL / fetch strategy / config.
- **Test source**: a "Test" icon on each source row runs a non-persisting connectivity check — new scraper endpoint `POST /sources/{slug}/test` (adapter registered? fetcher available for the strategy? list URL reachable through the same politeness gate scraping uses?) proxied by a new gateway endpoint `POST /v1/sources/{slug}/test`, with the result surfaced inline (ok / blocked / failed + detail).
- **Adapter awareness**: the scraper exposes its registered adapter slugs (`GET /adapters`, already available in code as `registry.known_slugs()`); the gateway proxies this and the web form warns when a source's slug has no registered adapter (creating one is allowed — the row is valid config — but it cannot be scraped until an adapter ships, and the UI must say so instead of failing cryptically at scrape time with a 404/500).
- OpenAPI spec + generated `shared-ts` client regenerated to cover the new endpoints.

Out of scope (deliberately): deleting sources (jobs reference `source_id`; cascade semantics deserve their own change), per-source schedule editing beyond the existing `config.cron` JSON (the scheduler workflow reads it as-is), and writing new scraper adapters.

## Capabilities

### New Capabilities

_None — all changes extend the existing sources administration surface._

### Modified Capabilities

- `sources-admin`: three new requirements — create a source from the page, edit an existing source's fields, and test a source's connectivity; plus the existing list requirement gains an "adapter registered" indicator.

## Impact

- **`apps/api`** (gateway): `sources` module gains `POST /sources`, `PATCH /sources/{slug}`, `POST /sources/{slug}/test`, `GET /sources/adapters`; `SourceRepository` port + Postgres implementation gain `create`/`update`; `ScraperClient` port + HTTP client gain `testSource`/`listAdapters`; new DTOs with validation; OpenAPI regenerated.
- **`services/scraper`**: new `GET /adapters` and `POST /sources/{slug}/test` endpoints (test = adapter lookup + fetcher resolution + one polite fetch, no `jobs_raw` writes, no run row).
- **`packages/shared-ts`**: regenerated client.
- **`apps/web`**: `sources-page.tsx` gains Add buttons (top + bottom), per-row Edit/Test actions, a create/edit dialog (shadcn `Dialog`, already in `components/ui`), a test-result inline state, and a "no adapter" badge; `lib/api/sources.ts` gains the new calls; EN + UK message catalogs extended.
- **DB**: no migration — `core.sources` already has every needed column (`slug` UNIQUE, `fetch_strategy` CHECK constraint enforce integrity; 409/400 mapped from violations).
