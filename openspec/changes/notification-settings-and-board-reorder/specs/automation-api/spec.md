# automation-api

## MODIFIED Requirements

### Requirement: Automation endpoint surface

The gateway SHALL expose an `automation` module with the endpoints n8n
orchestration needs: `GET /v1/automation/jobs/unprocessed` (raw jobs without
persisted LLM results, plus the active profile payload),
`POST /v1/automation/jobs/{id}/results` (transactional upsert of normalized
job, match and cover letter; accepts a `failed` status),
`GET /v1/automation/matches/unnotified?channel=` (matches at or above
`app_settings.match_threshold` lacking a notification for that channel),
`POST /v1/automation/notifications` (record a sent notification),
`GET /v1/automation/digest`, `POST /v1/automation/digest/sent`, and
`GET /v1/automation/settings` (the effective notification configuration a
workflow needs to decide whether and where to send). All endpoints SHALL be
documented in the OpenAPI spec under an `automation` tag and included in the
regenerated `packages/shared-ts` client.

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

#### Scenario: Settings feed drives workflow routing

- **WHEN** `GET /v1/automation/settings` is called
- **THEN** the response reports each channel's enabled flag and its
  destination (Telegram chat id, email recipient) and contains no secret
  value

## ADDED Requirements

### Requirement: Workflows honor the configured channel state

The `telegram-notifications` and `email-digest` workflows SHALL read the
gateway's settings endpoint at run time and SHALL NOT send when the
corresponding channel is disabled. When a channel is enabled, the workflow
SHALL send to the destination the settings report rather than to a value
hard-coded in the workflow definition. Secrets used to authenticate the send
SHALL continue to come from the workflow runner's own credential store.

#### Scenario: Disabled channel sends nothing

- **WHEN** the Telegram workflow runs while the Telegram channel is disabled
- **THEN** no message is sent and no notification is recorded in the ledger

#### Scenario: Destination comes from settings

- **WHEN** the Telegram channel is enabled with a chat id and the workflow
  runs with unnotified matches
- **THEN** the message is delivered to that chat id
