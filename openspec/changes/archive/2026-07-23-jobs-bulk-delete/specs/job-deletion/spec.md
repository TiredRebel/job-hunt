## ADDED Requirements

### Requirement: Bulk-delete multiple vacancies

The gateway SHALL expose `POST /v1/jobs/bulk-delete` accepting `{ jobIds: string[] }` and deleting each existing `core.jobs` row in a single database operation. The response SHALL be `{ deleted: number }`, the count of rows actually deleted. IDs that do not correspond to an existing vacancy SHALL be silently skipped — the endpoint SHALL NOT fail the batch or return an error solely because some ids were already absent. Dependent user-visible data (job matches, cover letters, reaction events, manual board positions) for each deleted vacancy SHALL be removed the same way single delete removes it; raw scrape provenance and scrape-run history SHALL be retained.

#### Scenario: Bulk delete with all existing ids

- **WHEN** a client sends `POST /v1/jobs/bulk-delete` with `jobIds: ["10", "11", "12"]`, all three existing
- **THEN** the response is HTTP 200 with `deleted=3`, and all three vacancies are absent from subsequent jobs and board queries

#### Scenario: Bulk delete with some already-missing ids

- **WHEN** a client sends `POST /v1/jobs/bulk-delete` with `jobIds: ["20", "999999"]` where `999999` does not exist
- **THEN** the response is HTTP 200 with `deleted=1`, vacancy `20` is deleted, and no error is returned for the missing id

#### Scenario: Bulk delete with an empty list

- **WHEN** a client sends `POST /v1/jobs/bulk-delete` with `jobIds: []`
- **THEN** the response is HTTP 200 with `deleted=0` and no vacancy is affected
