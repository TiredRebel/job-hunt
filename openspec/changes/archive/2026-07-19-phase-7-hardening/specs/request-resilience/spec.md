## ADDED Requirements

### Requirement: Transient cross-service calls are retried with backoff

Cross-service HTTP calls that are safe to repeat SHALL be retried on
transient failure: network/connection errors, HTTP 5xx, and HTTP 429. This
applies to the gateway's calls to the scraper and LLM services and to the
LLM service's calls to its provider adapters. Retries SHALL use bounded
exponential backoff with jitter and a configurable maximum attempt count;
after the final attempt the original error SHALL propagate unchanged.
Non-transient failures (4xx other than 429) SHALL NOT be retried. Requests
that are not safe to repeat SHALL NOT be retried automatically.

#### Scenario: Transient failure then success

- **WHEN** a downstream call returns 503 on the first attempt and 200 on the
  next
- **THEN** the caller retries after a backoff delay and returns the
  successful result to its own caller

#### Scenario: Non-transient failure is not retried

- **WHEN** a downstream call returns 400 or 404
- **THEN** the caller does not retry and surfaces the error immediately

#### Scenario: Retries are bounded

- **WHEN** a downstream call fails transiently on every attempt
- **THEN** the caller stops after the configured maximum attempts and
  propagates the last error rather than retrying forever

### Requirement: Retry attempts are observable

Each retry of a downstream call SHALL be logged at warning level, under the
active correlation id, naming the target and the attempt number, so a
retried-but-eventually-successful call is visible in the logs and a
give-up is distinguishable from a first-try failure.

#### Scenario: A retried call leaves a trail

- **WHEN** a downstream call is retried before succeeding
- **THEN** each retry produces a warning log line carrying the correlation
  id, the target, and the attempt number
