# job-detail (delta)

## MODIFIED Requirements

### Requirement: Cover letter viewing and editing

For jobs with a cover-letter draft, the detail view SHALL display the letter
and allow editing in a textarea with an explicit save that persists via the
cover-letter endpoint without losing concurrent state (diff-safe: the save
payload is the edited text, and the UI warns before discarding unsaved
edits). Jobs without a draft SHALL show a placeholder explaining when drafts
are generated. The detail view SHALL also offer a "Regenerate" action for
jobs with a persisted match: it calls
`POST /v1/jobs/{id}/cover-letter/regenerate`, shows a loading state while the
LLM produces a new draft, replaces the displayed letter on success, and
surfaces a localized error toast on failure. Regenerate SHALL warn before
replacing unsaved manual edits.

#### Scenario: Editing a draft

- **WHEN** the user edits the cover letter text and clicks save
- **THEN** the edited letter is persisted, a confirmation toast appears, and
  reopening the job shows the edited version

#### Scenario: Unsaved edit protection

- **WHEN** the user edits the letter and attempts to close the drawer
- **THEN** the UI asks for confirmation before discarding the changes

#### Scenario: Regenerating a draft

- **WHEN** the user clicks "Regenerate" on a matched job
- **THEN** a loading state is shown, a new draft is produced and persisted via
  the gateway, and the editor updates to the new text

#### Scenario: Regenerate with unsaved edits

- **WHEN** the user clicks "Regenerate" while the textarea has unsaved edits
- **THEN** the UI asks for confirmation before discarding the edits and only
  regenerates after the user confirms
