## ADDED Requirements

### Requirement: Public gateway endpoints are rate limited

The API gateway SHALL apply a request-rate limit to its public HTTP
endpoints. The limit (requests per window and window length) SHALL be
configurable via environment variables with sane defaults. A client that
exceeds the limit SHALL receive HTTP 429 (Too Many Requests). The limiter
SHALL key on the client's remote address (honoring the proxy hop from the
web `/api` route so all browser traffic is not counted as one client).

#### Scenario: Under the limit

- **WHEN** a client makes requests within the configured rate
- **THEN** every request is served normally

#### Scenario: Over the limit

- **WHEN** a client exceeds the configured number of requests within the
  window
- **THEN** further requests in that window receive HTTP 429 until the window
  resets

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
