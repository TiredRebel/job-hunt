# stage-board

## Purpose

The `/board` page: a kanban view over reaction stages with drag-and-drop (pointer and keyboard) that appends reaction events.

## Requirements

### Requirement: Kanban over reaction stages

The `/board` page SHALL render five columns — Saved, Applied, Interview, Offer, Rejected — populated from the jobs API filtered by current reaction stage. Cards SHALL show title, company, score badge, source indicator and days-in-stage, at most 64px tall. Column headers SHALL show the card count and use the stage color only on the header badge. The Rejected column SHALL be collapsed by default; column bodies SHALL virtualize past 50 cards.

#### Scenario: Board reflects current stages

- **WHEN** the user opens `/board`
- **THEN** each job with a reaction appears exactly once, in the column of its current stage

#### Scenario: Rejected collapsed

- **WHEN** the board loads
- **THEN** the Rejected column renders collapsed with its count visible and expands on demand

### Requirement: Drag and drop creates reaction events

Dragging a card to another column SHALL create a new reaction event for that job with the target stage (same API as bulk actions — the event log is append-only). The move SHALL apply optimistically; on API failure the card returns to its origin and a toast with an undo affordance appears. Undo after a successful move SHALL append a compensating event with the previous stage.
Dragging a card to another column SHALL additionally record the card's manual
position at the index it was dropped into. Failure to record the position
SHALL NOT roll back the stage change, since ordering is cosmetic and
self-corrects on the next reorder.

#### Scenario: Successful move

- **WHEN** the user drags a card from Saved to Applied
- **THEN** the card moves immediately, a reaction event with stage `applied` is persisted, and the job's timeline gains the event

#### Scenario: Cross-column drop lands at the drop index

- **WHEN** the user drags a card from Saved and drops it between the first and
  second cards of Applied
- **THEN** after reload the card renders in Applied at that position

#### Scenario: Failed move rolls back

- **WHEN** the reaction request fails after a drag
- **THEN** the card returns to its original column and an error toast explains the failure

### Requirement: Cards can be manually ordered within a column

A card SHALL be draggable to a specific position inside its own column, and
that order SHALL persist across reloads. Manual position SHALL be stored per
profile and per job. Cards that have never been positioned SHALL sort after
positioned cards, preserving the existing default order among themselves, so
enabling the feature never reshuffles an untouched board. Reordering SHALL
apply optimistically and roll back with an error toast if persistence fails.

#### Scenario: Reorder persists

- **WHEN** the user drags the third card in Applied to the top of Applied and
  reloads the page
- **THEN** that card renders first in Applied

#### Scenario: Untouched column keeps its default order

- **WHEN** a column whose cards have never been reordered is rendered
- **THEN** the cards appear in the API's default order, unchanged

#### Scenario: Failed reorder rolls back

- **WHEN** the order request fails after a within-column drag
- **THEN** the card returns to its original index and an error toast explains
  the failure

#### Scenario: Reordering does not change stage

- **WHEN** a card is reordered within its own column
- **THEN** no reaction event is created and the job's current stage is unchanged

### Requirement: Keyboard-accessible drag and drop

The board SHALL support keyboard-driven moves (space to lift, arrow keys to move between columns, space to drop, escape to cancel) and announce lift/move/drop via an `aria-live` region.

#### Scenario: Keyboard move

- **WHEN** a keyboard user lifts a card with space and moves it two columns right
- **THEN** each move is announced and dropping persists the new stage exactly as a pointer drag would

### Requirement: Delete a vacancy from the board

Each board card SHALL expose a keyboard-accessible destructive delete action
that identifies the vacancy by title. The action SHALL ask for confirmation
before issuing `DELETE /v1/jobs/{id}`. Canceling SHALL make no request. After a
successful deletion, the card SHALL disappear from its column, board ordering
of remaining cards SHALL be preserved, and a localized success message SHALL
be shown. A failed deletion SHALL leave the card and board state intact and
show a localized error.

#### Scenario: Confirm deletion from the board

- **WHEN** the user activates delete for a board card and confirms the
  title-labelled destructive prompt
- **THEN** the client sends `DELETE /v1/jobs/{id}`, removes the card after a
  successful response, preserves the order of remaining cards, and announces
  success

#### Scenario: Cancel deletion from the board

- **WHEN** the user activates delete for a board card and cancels the prompt
- **THEN** no delete request is sent and the card, column, and persisted order
  remain unchanged

#### Scenario: Board deletion failure

- **WHEN** the delete request fails
- **THEN** the card remains in its original column and an actionable localized
  error is shown without changing other cards
