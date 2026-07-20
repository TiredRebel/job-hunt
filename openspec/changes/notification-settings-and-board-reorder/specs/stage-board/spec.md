# stage-board

## ADDED Requirements

### Requirement: Cards can be manually ordered within a column

A card SHALL be draggable to a specific position inside its own column, and
that order SHALL persist across reloads. Manual position SHALL be stored per
profile and per job. Cards that have never been positioned SHALL sort after
positioned cards, preserving the existing default order among themselves, so
enabling the feature never reshuffles an untouched board. Reordering SHALL
apply optimistically and roll back with an error toast if persistence fails.

#### Scenario: Reorder persists

- **WHEN** the user drags the third card in Applied to the top of Applied
  and reloads the page
- **THEN** that card renders first in Applied

#### Scenario: Untouched column keeps its default order

- **WHEN** a column whose cards have never been reordered is rendered
- **THEN** the cards appear in the API's default order, unchanged

#### Scenario: Failed reorder rolls back

- **WHEN** the order request fails after a within-column drag
- **THEN** the card returns to its original index and an error toast
  explains the failure

#### Scenario: Reordering does not change stage

- **WHEN** a card is reordered within its own column
- **THEN** no reaction event is created and the job's current stage is
  unchanged

## MODIFIED Requirements

### Requirement: Drag and drop creates reaction events

Dragging a card to another column SHALL create a new reaction event for that
job with the target stage (same API as bulk actions — the event log is
append-only), and SHALL additionally record the card's manual position at
the index it was dropped into. The move SHALL apply optimistically; on API
failure the card returns to its origin and a toast with an undo affordance
appears. Undo after a successful move SHALL append a compensating event with
the previous stage. Failure to record the position SHALL NOT roll back the
stage change, since ordering is cosmetic and self-corrects on the next
reorder.

#### Scenario: Successful move

- **WHEN** the user drags a card from Saved to Applied
- **THEN** the card moves immediately, a reaction event with stage `applied`
  is persisted, and the job's timeline gains the event

#### Scenario: Cross-column drop lands at the drop index

- **WHEN** the user drags a card from Saved and drops it between the first
  and second cards of Applied
- **THEN** after reload the card renders in Applied at that position

#### Scenario: Failed move rolls back

- **WHEN** the reaction request fails after a drag
- **THEN** the card returns to its original column and an error toast
  explains the failure
