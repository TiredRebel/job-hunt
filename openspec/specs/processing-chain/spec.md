# processing-chain

## Purpose

n8n workflow that pushes unprocessed raw jobs through the LLM service (normalize, summarize, match, cover letter) and persists results back to the gateway, with idempotent, capped, failure-tolerant batches.

## Requirements

### Requirement: Unprocessed jobs are pushed through the LLM pipeline

A processing workflow SHALL periodically fetch unprocessed raw jobs from the
gateway (`GET /v1/automation/jobs/unprocessed`), run each through the LLM
service (`POST /process/job`) with the active profile, and persist the results
via the gateway (`POST /v1/automation/jobs/{id}/results`). One job's failure
SHALL NOT abort processing of the remaining jobs in the batch.

#### Scenario: New scraped jobs get processed

- **WHEN** a scrape run has persisted 5 new raw jobs and the processing
  workflow fires
- **THEN** each job is normalized, summarized, matched and (for scores at or
  above the threshold) given a cover-letter draft, and the results are
  persisted so the jobs appear scored in the dashboard

#### Scenario: One failing job does not block the batch

- **WHEN** the LLM service returns 502 for one job in a batch of 5
- **THEN** the other 4 jobs are persisted and the failed job remains in the
  unprocessed feed for the next run

### Requirement: Idempotent, capped processing

The unprocessed feed SHALL be capped per invocation (default 20) and result
persistence SHALL be idempotent per raw job, so re-running the workflow after
a partial failure never duplicates jobs, matches or cover letters.

#### Scenario: Re-run after partial failure

- **WHEN** the workflow re-runs after a crash mid-batch
- **THEN** already-persisted jobs are absent from the feed and no duplicate
  rows are created for them

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
