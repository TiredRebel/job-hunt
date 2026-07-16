# Proposal: phase-2-crawl4ai-fetch-ladder

## Why

Phase 2 shipped five adapters but skipped the last checklist item: the
ADR-006 fetch ladder (**API → crawl4ai → agent-browser**) was never actually
built. Today every HTML adapter fetches through plain `httpx`
(`PoliteClient`), so `core.sources.fetch_strategy` is a dead column: a source
whose listing or detail pages need JavaScript rendering silently yields zero
leads, and there is no browser-based fallback at all. This change makes the
strategy column real and closes the Phase 2 checklist.

## What Changes

- **`PageFetcher` port**: adapters stop depending on `PoliteClient`
  concretely and fetch through a small port (`get(url, params) → FetchResult`).
  Parsers are untouched — they keep receiving HTML text.
- **Politeness extracted and enforced for every fetcher**: robots.txt
  consultation and per-domain delay+jitter move into a `PolitenessGate`
  shared by all fetcher implementations, so a browser render obeys exactly
  the same rules as an `httpx` GET (docs/SOURCES.md politeness is
  fetcher-agnostic).
- **crawl4ai fetcher**: Playwright-backed rendering via `crawl4ai`'s
  `AsyncWebCrawler`, returning the **rendered raw HTML** (not markdown) so
  the existing BeautifulSoup parsers and content fingerprints keep working
  unchanged. Optional dependency: the service still boots (and `api`-strategy
  sources still run) when crawl4ai isn't installed.
- **HTTP-first with browser escalation**: sources marked `crawl4ai` still try
  the cheap `httpx` fetch first and only escalate to the browser when the
  response looks like a JS shell (parser-visible content missing).
  Escalation NEVER triggers on `FetchBlockedError` — rendering a page that
  answered 403/429 would be bot-detection evasion, which the project policy
  forbids.
- **agent-browser fallback**: a config-gated subprocess fetcher invoking the
  `agent-browser` CLI (Node-ecosystem tool, per ADR-002) for
  `agent-browser`-strategy sources. Degrades gracefully (leads counted as
  skipped) when the CLI is absent or errors; exact CLI contract verified at
  implementation time.
- **Registry wiring**: `create_adapter` resolves the fetcher from
  `core.sources.fetch_strategy` + source config and injects it; unknown or
  unavailable strategies produce a clear startup/run error instead of
  silently wrong fetching.

## Capabilities

### New Capabilities

- `fetch-strategy-ladder`: config-driven fetcher selection per source,
  HTTP-first escalation for JS shells, and politeness enforcement common to
  all fetchers.
- `crawl4ai-fetching`: browser-rendered page fetching via crawl4ai with raw
  HTML output, shared politeness, and optional-dependency handling.
- `agent-browser-fallback`: best-effort subprocess fetcher for JS-heavy
  sources with graceful degradation when the CLI is unavailable.

### Modified Capabilities

<!-- none — all existing main specs cover web-UI capabilities; the scraper
     service gains its first spec'd capabilities here -->

## Impact

- **services/scraper**: new `fetchers/` package (port, httpx, crawl4ai,
  agent-browser implementations + politeness gate), `PoliteClient` refactored
  to compose the gate, adapters re-typed against the port, registry selects
  fetchers by strategy; new settings (`crawl4ai` timeouts, agent-browser
  command); pyproject gains a `browser` optional-dependency group
  (`crawl4ai`); tests: fake fetchers + escalation/gate unit tests, fixtures
  unchanged, still no live network in CI.
- **DB**: none — `core.sources.fetch_strategy` already exists and is already
  seeded (`dou`/`workua`/`jobua` = `crawl4ai`, `reddit` = `api`,
  `upwork` = `agent-browser`).
- **Other services / web / n8n**: none — the scraper's REST surface is
  unchanged.
- **Docs**: SOURCES.md gains a short "how the ladder works now" note;
  README/dev-setup documents `uv sync --group browser` +
  `playwright install chromium` for browser fetching.
- **Out of scope**: Upwork behavior is unchanged (best-effort RSS stays; its
  `agent-browser` strategy only activates the new fetcher for public,
  non-challenged pages per SOURCES.md — no login automation, no challenge
  bypass).
