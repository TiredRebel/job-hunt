## ADDED Requirements

### Requirement: Structured JSON logs in every service

Every service (`apps/api`, `services/scraper`, `services/llm`) SHALL emit
logs as single-line JSON to stdout in production, with at least a timestamp,
level, logger name/source, and message field. The log level SHALL be
configurable via a `LOG_LEVEL` environment variable, defaulting to `info`.
Development mode MAY use a human-readable pretty format, but the production
default SHALL be JSON. The web app's `/api` proxy is exempt (it forwards, it
does not originate service logic).

#### Scenario: Python service emits JSON in production

- **WHEN** `services/scraper` or `services/llm` runs with its production
  logging configuration and logs a message
- **THEN** the emitted line is valid JSON containing at minimum a level, a
  message, a timestamp, and the correlation id when one is bound

#### Scenario: Log level is configurable

- **WHEN** a service starts with `LOG_LEVEL=warning`
- **THEN** `info` and `debug` lines are suppressed and `warning` and above
  are emitted

### Requirement: Correlation id is propagated end to end

A single correlation id SHALL follow a request across service boundaries.
Each service SHALL read an incoming `X-Correlation-Id` request header and, if
absent, mint a new one (a UUID). The service SHALL bind that id to every log
line produced while handling the request, echo it back on the response as
`X-Correlation-Id`, and, when it calls another service in the course of
handling the request, forward the same id on the outbound `X-Correlation-Id`
header. Ids received from callers SHALL be preferred over newly minted ones
so the same value spans the whole chain.

#### Scenario: Id originates at the edge and is echoed

- **WHEN** a request reaches a service with no `X-Correlation-Id` header
- **THEN** the service mints one, uses it in that request's logs, and returns
  it on the response's `X-Correlation-Id` header

#### Scenario: Id is adopted from the caller

- **WHEN** a request arrives carrying `X-Correlation-Id: abc-123`
- **THEN** the service logs under `abc-123` (it does not mint a new id) and
  echoes `abc-123` on the response

#### Scenario: Id crosses a service hop

- **WHEN** the gateway handles a request under correlation id `abc-123` and,
  while doing so, calls the scraper or LLM service
- **THEN** the outbound request carries `X-Correlation-Id: abc-123` and that
  downstream service's logs for the call appear under `abc-123`

#### Scenario: Browser call through the web proxy carries an id

- **WHEN** a browser Client Component calls a relative `/api/...` path
- **THEN** the web `/api` proxy forwards an incoming `X-Correlation-Id` if the
  browser sent one and otherwise mints one, so the gateway and everything
  downstream share a single id for that browser action
