# api-rate-limiting

## Purpose

Request throttling on the gateway's public endpoints, protecting it from
being overwhelmed by any single client, with the internal-token automation
surface exempt so scheduled/batch processing is never throttled.

## Requirements

### Requirement: Public gateway endpoints are rate limited

The API gateway SHALL apply a request-rate limit to its public HTTP
endpoints. The limit (requests per window and window length) SHALL be
configurable via environment variables with sane defaults. A client that
exceeds the limit SHALL receive HTTP 429 (Too Many Requests). The limiter
SHALL key on the client's socket remote address by default. `X-Forwarded-For`
is client-controllable and therefore untrusted by default — trusting it
without a proxy in front of the gateway would let any direct caller evade
the limit by sending a new value per request. A `TRUST_PROXY_HEADERS`
environment flag (default `false`) SHALL gate an opt-in mode where the
limiter instead prefers `X-Forwarded-For`'s leftmost entry, for deployments
with a trusted reverse proxy in front that overwrites/strips any
client-supplied value before it reaches the gateway. The web app's
same-origin `/api` proxy has its own, separately-gated
`TRUST_PROXY_HEADERS` flag (default `false`) controlling whether it
forwards an incoming `X-Forwarded-For` to the gateway — untrusted by
default there too, since `X-Forwarded-For` is not a forbidden `fetch()`
header and a browser can set it directly on a request to that route. When
both flags are enabled (a reverse proxy sits in front of the whole stack),
browser traffic is bucketed per real browser client; with either flag at
its default, it falls back to the coarser, still-safe default (the web
container's own address, or the gateway's socket address).

#### Scenario: Under the limit

- **WHEN** a client makes requests within the configured rate
- **THEN** every request is served normally

#### Scenario: Over the limit

- **WHEN** a client exceeds the configured number of requests within the
  window
- **THEN** further requests in that window receive HTTP 429 until the window
  resets

#### Scenario: X-Forwarded-For is untrusted by default

- **WHEN** `TRUST_PROXY_HEADERS` is unset or `false` and a direct caller
  sends a different `X-Forwarded-For` value on each request
- **THEN** the limiter keys on the caller's actual socket address regardless,
  so the spoofed header cannot be used to evade the limit

#### Scenario: X-Forwarded-For is honored when explicitly trusted

- **WHEN** `TRUST_PROXY_HEADERS` is `true`
- **THEN** the limiter keys on `X-Forwarded-For`'s leftmost entry when
  present, falling back to the socket address otherwise

#### Scenario: The web proxy forwards X-Forwarded-For only when its own trust flag is set

- **WHEN** a browser request carrying `X-Forwarded-For` arrives at the web
  app's same-origin `/api` proxy
- **THEN** the proxy forwards it to the gateway only if the web app's own
  `TRUST_PROXY_HEADERS` is `true`; otherwise it is dropped, not relayed
  from an untrusted browser

### Requirement: Internal automation routes are exempt from rate limiting

Routes authenticated by the internal token (`X-Internal-Token`, the n8n
automation surface under `/v1/automation`) SHALL NOT be rate limited, so
scheduled automation and batch processing are never throttled by the public
limit.

#### Scenario: Automation is not throttled

- **WHEN** the n8n automation surface calls internal-token routes at a rate
  that would exceed the public limit
- **THEN** the requests are served normally and never receive 429 from the
  rate limiter
