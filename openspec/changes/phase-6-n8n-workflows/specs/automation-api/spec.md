# automation-api

## ADDED Requirements

### Requirement: Automation endpoint surface

The gateway SHALL expose an `automation` module with the endpoints n8n
orchestration needs: `GET /v1/automation/jobs/unprocessed` (raw jobs without
persisted LLM results, plus the active profile payload),
`POST /v1/automation/jobs/{id}/results` (transactional upsert of normalized
job, match and cover letter; accepts a `failed` status),
`GET /v1/automation/matches/unnotified?channel=` (matches at or above
`app_settings.match_threshold` lacking a notification for that channel),
`POST /v1/automation/notifications` (record a sent notification),
`GET /v1/automation/digest` and `POST /v1/automation/digest/sent`. All
endpoints SHALL be documented in the OpenAPI spec under an `automation` tag
and included in the regenerated `packages/shared-ts` client.

#### Scenario: Unprocessed feed returns work items

- **WHEN** `GET /v1/automation/jobs/unprocessed?limit=20` is called while raw
  jobs exist without LLM results
- **THEN** the response contains at most 20 items with the fields
  `POST /process/job` requires (id, title, body, source URL) and the active
  profile

#### Scenario: Results persist transactionally

- **WHEN** `POST /v1/automation/jobs/42/results` is called with a normalized
  job, match and cover letter
- **THEN** all rows are persisted in one transaction, the raw job is marked
  processed, and repeating the call does not create duplicates

### Requirement: Service-token authentication

All `/v1/automation/*` endpoints SHALL require the shared internal token
(`X-Internal-Token` header matching `INTERNAL_API_TOKEN`, the same secret the
gateway already sends to the scraper/llm services); requests without a valid
token SHALL be rejected with 401 and MUST NOT leak endpoint existence details.

#### Scenario: Missing token rejected

- **WHEN** `GET /v1/automation/jobs/unprocessed` is called without the header
- **THEN** the gateway responds 401

#### Scenario: Valid token accepted

- **WHEN** the same request carries the correct `X-Internal-Token`
- **THEN** the gateway responds 200

### Requirement: Notification ledger enforces once-per-channel

Recording a notification SHALL insert into `core.notifications`; a duplicate
`(job_match_id, channel)` insert SHALL be rejected with 409 so concurrent
workflow executions cannot double-record.

#### Scenario: Duplicate record attempt

- **WHEN** `POST /v1/automation/notifications` is called twice for the same
  match and channel
- **THEN** the first call returns 201 and the second returns 409
