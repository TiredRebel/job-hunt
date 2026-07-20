## ADDED Requirements

### Requirement: Delete a vacancy from the jobs list

Each jobs-list row SHALL expose a keyboard-accessible destructive delete action
that identifies the vacancy by title. The action SHALL ask for confirmation
before issuing `DELETE /v1/jobs/{id}`. Canceling SHALL make no request. After a
successful deletion, the row SHALL disappear, active selection SHALL be
cleared for that id, the current filter/search URL SHALL remain intact, and a
localized success message SHALL be shown. A failed deletion SHALL leave the
table state intact and show a localized error.

#### Scenario: Confirm deletion from the list

- **WHEN** the user activates delete for a vacancy row and confirms the
  title-labelled destructive prompt
- **THEN** the client sends `DELETE /v1/jobs/{id}`, removes the row after a
  successful response, preserves the current filters, and announces success

#### Scenario: Cancel deletion from the list

- **WHEN** the user activates delete for a vacancy row and cancels the prompt
- **THEN** no delete request is sent and the row, selection, filters, and table
  state remain unchanged

#### Scenario: List deletion failure

- **WHEN** the delete request fails
- **THEN** the row remains visible, the table state is not corrupted, and an
  actionable localized error is shown
