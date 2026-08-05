## ADDED Requirements

### Requirement: Delete a source

Each source row SHALL offer a "Delete" action calling `DELETE /v1/sources/{slug}`. Activating it SHALL ask for confirmation naming the source before any request is made. Confirmed deletion SHALL permanently remove the source row and respond with a `deleted: true` result. An unknown slug SHALL respond 404. Deletion SHALL be rejected with 409 while the source has any associated `core.jobs`, `scraper.jobs_raw`, or `scraper.scrape_runs` rows, and the response SHALL explain that the source must be emptied of that data or left disabled instead — no dependent job or scrape-run data SHALL be deleted or reassigned as a side effect. A successful deletion SHALL refresh the sources list and show a confirmation toast; a rejected deletion SHALL leave the source and its data unchanged and show an error toast with the server's explanation.

#### Scenario: Deleting an unused source

- **WHEN** the user clicks Delete on a source that has never been scraped (no jobs, raw jobs, or scrape runs) and confirms
- **THEN** the API responds with `deleted: true`, the row disappears from the list, and a success toast appears

#### Scenario: Cancelling at the confirmation

- **WHEN** the user clicks Delete but dismisses the confirmation
- **THEN** no request is made and the source remains unchanged

#### Scenario: Source with data is protected

- **WHEN** the user clicks Delete on a source that has associated jobs or scrape runs and confirms
- **THEN** `DELETE /v1/sources/{slug}` responds 409 without removing the source or any of its data, and the row shows an error toast explaining the source must be emptied or disabled instead

#### Scenario: Unknown slug

- **WHEN** a `DELETE /v1/sources/{slug}` request arrives for a slug that does not exist
- **THEN** the response is 404
