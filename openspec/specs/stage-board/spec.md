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

#### Scenario: Keyboard move into an empty column

- **WHEN** a keyboard user lifts a card with space and moves it one column right into a column that currently has no cards
- **THEN** the move is announced and dropping places the card in that column, persisting the new stage exactly as a pointer drag would

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

### Requirement: Pointer drops resolve to the target under the pointer

During a pointer drag, the drop target SHALL be the card or column actually under the pointer. When the pointer is over a card, dropping SHALL land at that card's index; when it is over a column's empty area, dropping SHALL land at the end of that column; when the pointer is between droppables, the target SHALL fall back to the droppable intersecting the dragged card's rect. Keyboard drags SHALL keep their existing resolution (closest-center with the self-collision guard).

#### Scenario: Drop near a column boundary lands in the pointed-at column

- **WHEN** a drag ends with the pointer inside column A near its boundary with column B, even though the dragged card's center is closer to column B
- **THEN** the drop resolves to column A

#### Scenario: Drop on a card lands at that card's index

- **WHEN** a drag ends with the pointer over a specific card
- **THEN** the drop resolves to that card and the dragged card lands at its index

#### Scenario: Drop on empty column space lands at the end

- **WHEN** a drag ends with the pointer over a column's empty area below its last card
- **THEN** the drop resolves to the column and the card lands at the end

#### Scenario: Keyboard drags are unchanged

- **WHEN** a drag has no pointer coordinates (keyboard sensor)
- **THEN** drop resolution is identical to closest-center resolution

### Requirement: Card re-renders triggered by a drag stay cheap and bounded

`DndContext` broadcasts drag state (`active`/`over`) via React Context to every mounted card, so a drag start unavoidably re-renders cards outside the dragged card's own column — this is a dnd-kit architectural property, not fixable by memoizing `StageCard`, and is out of this requirement's scope to eliminate. What SHALL hold instead: each card re-render SHALL do only cheap, constant-time work (no per-render network calls, no unbounded loops, no re-parsing of data that hasn't changed), and a card whose own props (`job`, `dragging`, `onDeleteJob`) are unchanged SHALL NOT re-render when triggered by an unrelated _prop_ change further up the tree (as opposed to the shared drag Context) — i.e. `React.memo` SHALL still block ordinary prop-driven re-render propagation. A repeatable vitest check SHALL assert both: a prop-driven parent re-render with stable props causes zero re-renders of an unrelated card, and a real drag-start's re-render count on other-column cards stays bounded (does not regress to unbounded growth).

#### Scenario: Unrelated prop-driven re-render skips unchanged cards

- **WHEN** a component above the board re-renders with a card's `job`, `dragging`, and `onDeleteJob` props unchanged
- **THEN** that card does not re-render

#### Scenario: Drag-start re-renders of other-column cards stay bounded

- **WHEN** a card is lifted, triggering `DndContext`'s shared drag-state Context to update
- **THEN** other-column cards may re-render (a known dnd-kit Context-propagation ceiling) but each such re-render does only cheap, constant-time work, and the per-lift render count does not regress above a small fixed bound

#### Scenario: Render-cost check is repeatable

- **WHEN** the render-cost check runs in CI
- **THEN** it deterministically fails if a stable-prop re-render reaches an unrelated card, or if drag-start re-render counts regress past the fixed bound, and passes otherwise
