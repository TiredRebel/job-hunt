## MODIFIED Requirements

### Requirement: Fetcher selection driven by source strategy

The scraper SHALL select a page fetcher per source from `core.sources.fetch_strategy`: `api` uses plain polite HTTP; `crawl4ai` and `agent-browser` use an HTTP-first fetcher that can escalate to the corresponding browser-based fetcher. Each adapter registration SHALL explicitly provide its factory and optional adapter-relevant content-probe selector to fetcher selection; the registry MUST NOT infer transport metadata through undeclared adapter class attributes or runtime duck typing. DOU, Work.ua, and Job.ua SHALL share behavior-preserving static-HTML lifecycle mechanics while retaining separate, fixture-tested listing parsers and source definitions. Adapters SHALL depend only on the `PageFetcher` port — parsing and fingerprinting behavior MUST NOT change with the transport. An unknown strategy or a required-but-unavailable fetcher SHALL fail the scrape run with an actionable error, never fall back silently to a different transport.

#### Scenario: API-strategy source keeps plain HTTP

- **WHEN** a scrape run starts for `reddit` (strategy `api`)
- **THEN** all fetches go through the polite HTTP fetcher and behave exactly as before this change

#### Scenario: Browser-strategy source without browser stack installed

- **WHEN** a run is triggered for a `crawl4ai`-strategy source on an install without the `browser` dependency group
- **THEN** the run fails with an error message naming the missing dependency and the install command, and no silent HTTP-only scrape occurs

#### Scenario: Static source wires its content probe explicitly

- **WHEN** the registry creates a DOU, Work.ua, or Job.ua adapter
- **THEN** its registration supplies that source definition's detail-content selector to the fetcher factory without inspecting the adapter class

#### Scenario: Non-static source has no HTML content probe

- **WHEN** the registry creates the Reddit or Upwork adapter
- **THEN** its registration supplies no HTML content-probe selector and its existing source-specific behavior is unchanged

#### Scenario: Shared mechanics preserve source-specific searches

- **WHEN** the shared static-HTML adapter discovers jobs for DOU, Work.ua, and Job.ua
- **THEN** it uses `search` for DOU and Work.ua, `q` for Job.ua, and delegates each response to that source's separately fixture-tested parser
