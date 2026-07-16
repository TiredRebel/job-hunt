# fetch-strategy-ladder

## ADDED Requirements

### Requirement: Fetcher selection driven by source strategy

The scraper SHALL select a page fetcher per source from
`core.sources.fetch_strategy`: `api` uses plain polite HTTP; `crawl4ai` and
`agent-browser` use an HTTP-first fetcher that can escalate to the
corresponding browser-based fetcher. Adapters SHALL depend only on the
`PageFetcher` port — parsing and fingerprinting behavior MUST NOT change
with the transport. An unknown strategy or a required-but-unavailable
fetcher SHALL fail the scrape run with an actionable error, never fall back
silently to a different transport.

#### Scenario: API-strategy source keeps plain HTTP

- **WHEN** a scrape run starts for `reddit` (strategy `api`)
- **THEN** all fetches go through the polite HTTP fetcher and behave exactly
  as before this change

#### Scenario: Browser-strategy source without browser stack installed

- **WHEN** a run is triggered for a `crawl4ai`-strategy source on an install
  without the `browser` dependency group
- **THEN** the run fails with an error message naming the missing dependency
  and the install command, and no silent HTTP-only scrape occurs

### Requirement: Politeness is enforced identically for every fetcher

Robots.txt consultation and the per-domain minimum delay with jitter SHALL
be enforced by one shared politeness gate for all fetchers, so browser
renders and HTTP requests to the same host share a single pacing budget and
identical robots decisions, using the same descriptive User-Agent.

#### Scenario: Browser render obeys the per-domain delay

- **WHEN** an HTTP attempt to a host is immediately followed by an escalated
  browser render of the same host
- **THEN** the render waits out the same per-domain delay window the next
  HTTP request would have waited

#### Scenario: Robots deny blocks all transports

- **WHEN** robots.txt disallows a URL for the scraper's User-Agent
- **THEN** the fetch raises the blocked error regardless of which fetcher
  was selected, and no browser render is attempted

### Requirement: Escalation only for JS shells, never for blocked responses

The escalating fetcher SHALL try polite HTTP first and escalate to the
browser fetcher only when the response body is detected as a JavaScript
shell (parseable page with the adapter-relevant content absent). A
`FetchBlockedError` (robots deny or anti-bot status) SHALL propagate
immediately without escalation — browser rendering MUST NOT be used to
circumvent a host's refusal. This extends to responses that content-match a
known anti-bot interstitial (e.g. a Cloudflare "Just a moment..." challenge
page): such responses SHALL also raise `FetchBlockedError` without
escalation, even though they would otherwise present as a JS shell — a real
browser rendering _through_ a challenge page is bot-detection evasion. Once
a host escalates, subsequent fetches to that host within the same run SHALL
go directly to the browser fetcher.

#### Scenario: Static page needs no browser

- **WHEN** the HTTP response for a `crawl4ai`-strategy source contains the
  expected visible content
- **THEN** the HTTP body is returned and no browser render happens

#### Scenario: JS shell escalates

- **WHEN** the HTTP response body strips down to (near-)empty visible text
- **THEN** the fetch is retried through the browser fetcher and the rendered
  HTML is returned

#### Scenario: Anti-bot answer is not escalated

- **WHEN** the HTTP attempt raises `FetchBlockedError` (e.g. HTTP 403)
- **THEN** the error propagates, no browser render is attempted, and the
  lead is handled by the existing skip/degrade paths

#### Scenario: Anti-bot challenge page is not escalated

- **WHEN** the HTTP response is a 200 OK whose body content-matches a known
  anti-bot interstitial (e.g. contains "Just a moment...")
- **THEN** the fetch raises `FetchBlockedError` and no browser render is
  attempted, even though the body would otherwise look like a JS shell

#### Scenario: Host escalation is remembered within a run

- **WHEN** a host has already escalated once during a run
- **THEN** later fetches to that host skip the doomed HTTP attempt and use
  the browser fetcher directly
