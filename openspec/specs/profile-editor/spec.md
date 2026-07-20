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

### Requirement: Notifications section

The `/profile` page SHALL render a Notifications section, separate from the
matching-profile form, that loads the notification configuration and edits it:
per-channel enable toggles, the Telegram chat id, the SMTP host, port, username,
sender and recipient addresses, the name of the environment variable holding
each secret, the match threshold and the digest hour. Saving SHALL persist
through the settings API and confirm with a toast; validation errors SHALL
render inline per field. The section SHALL be localized in both supported
locales.

#### Scenario: Editing a chat id

- **WHEN** the user enters a Telegram chat id and saves
- **THEN** the value is persisted through the settings API and reloading the
  page shows it

#### Scenario: Invalid port blocked inline

- **WHEN** the user enters an SMTP port of `0` and saves
- **THEN** an inline localized error appears and no request is made

#### Scenario: Saving notifications leaves the matching profile untouched

- **WHEN** the user saves the Notifications section
- **THEN** no request is made to the profiles API and the matching-profile
  form's values are unaffected

### Requirement: Secret status is shown without revealing secrets

For each channel the section SHALL display whether the referenced environment
variable is currently populated, so a user can tell a misconfigured channel
from a working one. The page SHALL NOT display, or receive from the API, any
secret value, and SHALL NOT offer a field for entering one.

#### Scenario: Configured secret

- **WHEN** the environment variable named for the Telegram bot token holds a
  value
- **THEN** the Telegram channel shows a configured indicator and no token value
  anywhere

#### Scenario: Missing secret

- **WHEN** that environment variable is unset
- **THEN** the channel shows a not-configured indicator explaining which
  variable name is expected
