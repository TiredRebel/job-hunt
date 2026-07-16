# stage-board

## ADDED Requirements

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

#### Scenario: Successful move

- **WHEN** the user drags a card from Saved to Applied
- **THEN** the card moves immediately, a reaction event with stage `applied` is persisted, and the job's timeline gains the event

#### Scenario: Failed move rolls back

- **WHEN** the reaction request fails after a drag
- **THEN** the card returns to its original column and an error toast explains the failure

### Requirement: Keyboard-accessible drag and drop

The board SHALL support keyboard-driven moves (space to lift, arrow keys to move between columns, space to drop, escape to cancel) and announce lift/move/drop via an `aria-live` region.

#### Scenario: Keyboard move

- **WHEN** a keyboard user lifts a card with space and moves it two columns right
- **THEN** each move is announced and dropping persists the new stage exactly as a pointer drag would
