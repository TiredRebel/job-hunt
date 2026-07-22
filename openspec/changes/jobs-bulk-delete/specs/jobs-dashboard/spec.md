## MODIFIED Requirements

### Requirement: Bulk stage actions

The user SHALL be able to select multiple rows via checkboxes; a selection summons a bottom action bar showing the count and stage actions (Mark applied, Reject, Save, Set stage…) plus a destructive Delete action. Confirming a stage action SHALL call `POST /v1/reactions/bulk` for all selected job ids and refresh the table. Confirming Delete SHALL call `POST /v1/jobs/bulk-delete` for all selected job ids, remove the deleted rows from the table, clear the selection, and close the job detail drawer if the currently-open job (if any) is among the deleted ids. Escape SHALL clear the selection. Destructive actions (Reject, Delete) SHALL require an inline arm-then-confirm control, not a native browser confirm dialog.

#### Scenario: Bulk mark applied

- **WHEN** the user selects 5 rows and clicks "Mark applied"
- **THEN** one bulk reactions request with the 5 job ids and stage `applied` is sent, the rows' stage badges update, and a polite toast confirms

#### Scenario: Bulk action failure

- **WHEN** the bulk request fails
- **THEN** the table state is not corrupted and an error toast explains the failure

#### Scenario: Bulk delete removes selected rows

- **WHEN** the user selects 3 rows, clicks "Delete", and confirms via the armed control
- **THEN** one `POST /v1/jobs/bulk-delete` request with the 3 job ids is sent, the 3 rows disappear from the table, the selection is cleared, and a success toast confirms the count deleted

#### Scenario: Bulk delete closes the open drawer

- **WHEN** the detail drawer is open for a job that is part of the current selection, and the user bulk-deletes that selection
- **THEN** the drawer closes as part of the same action, with no stale content shown afterward

#### Scenario: Bulk delete requires arming before it fires

- **WHEN** the user clicks "Delete" once with rows selected
- **THEN** no delete request is sent yet, and the control switches to a "Confirm" state; clicking it again sends the bulk-delete request

#### Scenario: Bulk delete failure

- **WHEN** the bulk-delete request fails
- **THEN** the table state is not corrupted, the selection is preserved, and an error toast explains the failure
