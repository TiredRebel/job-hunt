## MODIFIED Requirements

### Requirement: Politeness is enforced identically for every fetcher

Robots.txt consultation and the per-domain minimum delay with jitter SHALL
be enforced by one shared politeness gate for all fetchers, so browser
renders and HTTP requests to the same host share a single pacing budget and
identical robots decisions, using the same descriptive User-Agent. The
per-domain minimum delay, the jitter bound, and the robots-respect toggle
SHALL be configurable **per source** from `core.sources.config` (keys
`min_delay` / `jitter` / `respect_robots`); a source that specifies none
SHALL fall back to the service-global `Settings` defaults. Per-source values
SHALL only relax or tighten pacing for that source's own hosts — the gate
remains a single instance enforcing one budget and one robots decision per
host, so two sources that resolve to the same host do not each get an
independent delay window.

#### Scenario: Browser render obeys the per-domain delay

- **WHEN** an HTTP attempt to a host is immediately followed by an escalated
  browser render of the same host
- **THEN** the render waits out the same per-domain delay window the next
  HTTP request would have waited

#### Scenario: Robots deny blocks all transports

- **WHEN** robots.txt disallows a URL for the scraper's User-Agent
- **THEN** the fetch raises the blocked error regardless of which fetcher
  was selected, and no browser render is attempted

#### Scenario: Source-specific delay overrides the default

- **WHEN** a source's `config` sets `min_delay` to a value different from the
  service-global default
- **THEN** requests for that source's hosts are paced by the source-specific
  delay, while a source that sets no `min_delay` is paced by the global
  default

#### Scenario: Missing per-source politeness falls back to defaults

- **WHEN** a source's `config` contains no politeness keys
- **THEN** the global `min_delay`, `jitter`, and `respect_robots` defaults
  apply, matching pre-change behavior
