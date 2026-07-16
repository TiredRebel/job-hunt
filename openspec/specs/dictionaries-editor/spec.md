# dictionaries-editor

## Purpose

The `/dictionaries` page: view and edit keyword dictionaries (search, stop-words, must-have, nice-to-have, aliases) with full CRUD and per-item enable toggles.

## Requirements

### Requirement: Dictionaries grouped by kind

The `/dictionaries` page SHALL present keyword dictionaries from `GET /v1/keyword-dictionaries` grouped by kind — search, stop-words, must-have, nice-to-have, aliases — each as an editable table/section with tag-style item rendering.

#### Scenario: Viewing dictionaries

- **WHEN** the user opens `/dictionaries`
- **THEN** every dictionary kind renders as its own section listing current items with their enabled state

### Requirement: Dictionary CRUD

The user SHALL be able to: add items via an inline add row, edit items in place, delete items (with inline confirm), and toggle an enable/disable switch per item. Mutations SHALL use the keyword-dictionaries endpoints (`POST`, `PATCH /{slug}`, `DELETE /{slug}`) and update the view without a full reload. Validation errors from the API SHALL render next to the offending input.

#### Scenario: Adding a search term

- **WHEN** the user types "typescript remote" in the search-dictionary add row and confirms
- **THEN** the item is created via the API and appears in the list immediately

#### Scenario: Disabling a stop-word

- **WHEN** the user toggles a stop-word item off
- **THEN** the item is updated via the API and rendered in a visually muted state

#### Scenario: Deleting an item

- **WHEN** the user deletes an alias item and confirms inline
- **THEN** the item is removed via the API and disappears from the list
