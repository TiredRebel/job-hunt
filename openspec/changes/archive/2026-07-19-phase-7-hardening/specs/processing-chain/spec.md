## MODIFIED Requirements

### Requirement: Poison jobs are marked failed after repeated attempts

The gateway SHALL track processing attempts per raw job; a job that keeps
failing SHALL be markable as failed (excluded from the feed) instead of
recycling forever. The attempt limit before a job is dead-lettered SHALL be
configurable via environment variable with a sane default. Dead-lettered
jobs SHALL be inspectable through a gateway read endpoint that lists raw
jobs in the failed processing state, so an operator can see what stopped
processing and why without querying the database directly.

#### Scenario: Job fails repeatedly

- **WHEN** a raw job has exceeded the attempt limit
- **THEN** it is marked failed, leaves the unprocessed feed, and is visible as
  failed for later inspection

#### Scenario: Attempt limit is configurable

- **WHEN** the dead-letter attempt-limit environment variable is set to a
  value different from the default
- **THEN** a job is dead-lettered after that many failed attempts rather than
  the default

#### Scenario: Dead-lettered jobs are listable

- **WHEN** an operator calls the gateway's dead-letter listing endpoint
- **THEN** it returns the raw jobs currently in the failed processing state,
  each with enough detail (id, source, url, attempt count) to investigate
