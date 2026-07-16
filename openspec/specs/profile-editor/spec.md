# profile-editor

## Purpose

The `/profile` page: edit the active matching profile (skills, seniority, salary expectations, locations, remote preference, personal stop-words) with validation and unsaved-changes protection.

## Requirements

### Requirement: Profile form

The `/profile` page SHALL load the active profile from `GET /v1/profiles/active` and render an editable form: skills (tag input), seniority (select), salary expectation (min/max with currency), preferred locations (tag input), remote preference, and personal stop-words (tag input). Saving SHALL persist via `PATCH /v1/profiles/{id}` and confirm with a toast; validation errors SHALL render inline per field.

#### Scenario: Editing skills

- **WHEN** the user adds "langgraph" to skills and saves
- **THEN** the profile is updated via the API and reloading the page shows the new skill

#### Scenario: Invalid salary range

- **WHEN** the user enters a minimum salary greater than the maximum and saves
- **THEN** the form blocks submission with an inline localized error and no API call is made

### Requirement: Unsaved changes protection

The form SHALL track dirty state: navigating away with unsaved changes SHALL prompt for confirmation, and a reset control SHALL restore the last saved values.

#### Scenario: Discard prompt

- **WHEN** the user edits the seniority field and clicks a sidebar link without saving
- **THEN** a confirmation prompt appears before navigation proceeds
