## ADDED Requirements

### Requirement: Deleting from the detail view closes it immediately

The detail view (drawer and full page) SHALL offer a destructive "Delete" action in its footer, identical in both variants. On successful deletion, the view SHALL close (drawer: clear the `?job=` URL param and dismiss the sheet; full page: navigate back to `/jobs`) and show a localized success toast, both without waiting on unrelated background cache invalidation — closing and the toast SHALL NOT be delayed by a refetch of the now-deleted job's own detail data.

#### Scenario: Drawer closes right after a successful delete

- **WHEN** the user opens a job's drawer, clicks "Delete", and confirms
- **THEN** the vacancy is deleted, the drawer closes and the success toast appears within the same interaction, with no stale content shown in the interim

#### Scenario: Full-page detail navigates away right after a successful delete

- **WHEN** the user is on `/jobs/[id]`, clicks "Delete", and confirms
- **THEN** the vacancy is deleted and the browser navigates to `/jobs` immediately, without a delay waiting on background list invalidation

#### Scenario: Delete failure leaves the view open

- **WHEN** the delete request fails
- **THEN** the view remains open showing the job's data, and a localized error toast explains the failure
