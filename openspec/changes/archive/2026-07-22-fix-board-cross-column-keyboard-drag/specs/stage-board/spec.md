## MODIFIED Requirements

### Requirement: Keyboard-accessible drag and drop

The board SHALL support keyboard-driven moves (space to lift, arrow keys to move between columns, space to drop, escape to cancel) and announce lift/move/drop via an `aria-live` region.

#### Scenario: Keyboard move

- **WHEN** a keyboard user lifts a card with space and moves it two columns right
- **THEN** each move is announced and dropping persists the new stage exactly as a pointer drag would

#### Scenario: Keyboard move into an empty column

- **WHEN** a keyboard user lifts a card with space and moves it one column right into a column that currently has no cards
- **THEN** the move is announced and dropping places the card in that column, persisting the new stage exactly as a pointer drag would
