# crawl4ai-fetching

## Purpose

Browser-rendered page fetching via crawl4ai with raw HTML output, shared
politeness, and optional-dependency handling.

## Requirements

### Requirement: Browser-rendered fetching returns raw HTML

The crawl4ai fetcher SHALL render pages with a headless browser via
crawl4ai's `AsyncWebCrawler` and return the **rendered raw HTML** (not
markdown), so existing BeautifulSoup parsers and content fingerprints work
identically on rendered and plain-HTTP bodies. Each request SHALL pass the
shared politeness gate first, send the project's descriptive User-Agent,
bypass crawl4ai's own cache, and respect a bounded page timeout from
settings. crawl4ai-reported anti-bot statuses SHALL map to the same
`FetchBlockedError` semantics as the HTTP fetcher.

#### Scenario: JS-rendered listing becomes parseable

- **WHEN** the fetcher renders a listing page whose vacancy cards are
  injected client-side
- **THEN** the returned HTML contains the rendered cards and the adapter's
  existing parser extracts leads from it

#### Scenario: Render timeout is bounded

- **WHEN** a page fails to reach `domcontentloaded` within the configured
  timeout
- **THEN** the fetch fails for that lead only (counted per existing
  error/skip semantics) and the run continues

### Requirement: crawl4ai is an optional dependency

The crawl4ai stack (crawl4ai + Playwright + browser) SHALL be an optional
dependency group; the scraper service SHALL start and serve `api`-strategy
sources without it installed. The crawl4ai import SHALL happen lazily inside
the fetcher factory, and the browser instance SHALL be started on first use
and closed on service shutdown.

#### Scenario: Service boots without the browser stack

- **WHEN** the service starts on an install without the `browser` group
- **THEN** startup succeeds and `api`-strategy scrape runs work normally

#### Scenario: One browser lifecycle per process

- **WHEN** multiple leads are fetched through the crawl4ai fetcher in one
  run
- **THEN** they share one browser instance, which is disposed when the
  service shuts down
