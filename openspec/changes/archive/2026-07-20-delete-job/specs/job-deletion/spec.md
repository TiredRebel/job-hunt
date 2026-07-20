## ADDED Requirements

### Requirement: Delete a normalized vacancy

The gateway SHALL expose `DELETE /v1/jobs/{id}`. When the vacancy exists, the
operation SHALL delete the normalized `core.jobs` row in an atomic database
operation, return HTTP 200 with `{ "deleted": true }`, and rely on the database
relationships to remove its job matches, cover letters, reaction events, and
manual board positions. Raw scrape provenance and scrape-run history SHALL be
retained.

#### Scenario: Delete an existing vacancy

- **WHEN** a client sends `DELETE /v1/jobs/42` for an existing vacancy
- **THEN** the API returns HTTP 200 with `deleted=true`, the vacancy is absent
  from subsequent jobs and board queries, and its dependent user-visible rows
  no longer exist

#### Scenario: Delete an unknown vacancy

- **WHEN** a client sends `DELETE /v1/jobs/999999` for a vacancy that does not
  exist
- **THEN** the API returns HTTP 404 and does not modify any other vacancy or
  related data

#### Scenario: Dependent cleanup is atomic

- **WHEN** deletion encounters a database failure while removing the vacancy
- **THEN** the transaction rolls back and the vacancy and its dependent rows
  remain unchanged

### Requirement: Preserve deletion semantics across retries

The API SHALL distinguish a successful first deletion from a later request for
the now-missing vacancy: the first request SHALL return `deleted=true`, and a
later request for the same id SHALL return 404 without affecting other data.

#### Scenario: Repeated delete request

- **WHEN** a client deletes vacancy 42 successfully and then sends the same
  delete request again
- **THEN** the first response is successful, the second response is 404, and
  no unrelated vacancy is changed
