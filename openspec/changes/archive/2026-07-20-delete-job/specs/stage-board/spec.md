## ADDED Requirements

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
