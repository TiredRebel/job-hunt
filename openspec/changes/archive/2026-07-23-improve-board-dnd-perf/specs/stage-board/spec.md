## ADDED Requirements

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
