## Context

`/board`'s `StageBoard` (`apps/web/src/components/board/stage-board.tsx`) wires one `DndContext` over five stage columns. Each column is both a `useDroppable({ id: stage })` container and, for its cards, a `@dnd-kit/sortable` `SortableContext`. The `KeyboardSensor` uses `@dnd-kit/sortable`'s stock `sortableKeyboardCoordinates` as its `coordinateGetter`.

Confirmed via a CI trace (`board-reorder.spec.ts`'s "cross-column keyboard drag" test): space-lift → `ArrowRight` → space-drop announces `"Move cancelled"` instead of moving the card. `handleDragEnd` in `stage-board.tsx` takes that branch precisely when `event.over` is `null`/`undefined` — so the keyboard sensor's virtual position after `ArrowRight` is landing somewhere `closestCenter` (the `DndContext`'s configured collision detector) resolves to no droppable at all.

Reading `sortableKeyboardCoordinates`'s actual source (`node_modules/@dnd-kit/sortable/dist/sortable.esm.js`): on `ArrowRight` it filters `droppableContainers.getEnabled()` to those with `rect.left > collisionRect.left` (i.e. _any_ droppable further right, not just the adjacent column — the filter has no vertical/row awareness), then picks among them with `closestCorners`. In a 5-column board this makes Interview/Offer/Rejected valid candidates alongside Applied on every rightward press, and the corner-distance heuristic is the only thing keeping the "wrong" column from winning. It's a general-purpose heuristic built for grids/free-form drop zones, not a fixed, ordered set of columns — exactly the class of layout `@dnd-kit`'s own "Multiple Containers" example replaces with a custom coordinate getter, rather than trying to tune the generic one.

**Investigation update (post-spike): this is an intermittent race, not a deterministic pick of the wrong column.** Manual reproduction in a real browser (two attempts) and 8 local headless-Playwright runs against the dev stack passed 7/8 times; only one local run failed, and it failed differently (a setup-phase locator timeout, not `"Move cancelled"` — consistent with local test-harness overload from rapid repeated runs, not the bug itself). Re-examining the original CI trace's `before`/`after` action log and network log for the exact failing sequence: `event.over` resolves to `null` essentially instantly on drop (the `aria-live` region already reads `"Move cancelled"` within ~8ms of the drop keypress, both on the initial attempt and the retry), and there is no API/query-refetch activity anywhere near the gesture (last network call is ~700ms before the lift begins) — ruling out a query-invalidation-driven DOM remount racing the drag. No console error or warning is captured either. The precise internal mechanism (why the generic getter's candidate search comes up empty specifically on this timing) is not fully isolated. Proceeding with the fix below regardless: it replaces the ambiguous multi-candidate corner-distance search with a direct single-target droppable lookup, which removes the surface area for this class of race whether or not the exact prior mechanism is ever pinned down.

## Goals / Non-Goals

**Goals:**

- `ArrowRight`/`ArrowLeft` after a space-lift deterministically moves the active card into the next/previous column in `BOARD_STAGES` order, landing on a real drop target every time (never a null `over`), matching the existing `stage-board` spec's keyboard-accessible requirement.
- `ArrowUp`/`ArrowDown` within-column reorder keeps working exactly as today (this path is not implicated in the failure and `board-reorder.spec.ts`'s within-column test already passes).
- No change to pointer/mouse drag, drop-index placement, optimistic updates, or the undo affordance.

**Non-Goals:**

- Not fixing or tuning `@dnd-kit/sortable`'s generic `sortableKeyboardCoordinates` in place — replacing it for the cross-column case is simpler and removes the ambiguity rather than papering over it.
- Not changing collapsed-column behavior (Rejected stays collapse-only; a collapsed column is not a valid keyboard-move target, same as today implicitly via `SortableContext` not rendering when collapsed).
- Not re-litigating the `stage-board` spec — the target behavior is already specified; this is a bug fix.

## Decisions

**Decision: replace the `KeyboardSensor`'s `coordinateGetter` with a board-specific one, not a patched/tuned generic one.**

The new getter:

- On `ArrowUp`/`ArrowDown`: delegates to the existing `sortableKeyboardCoordinates` (unaffected path, already correct — `board-reorder.spec.ts`'s within-column test already passes against it).
- On `ArrowLeft`/`ArrowRight`: looks up the active card's current column via `BOARD_STAGES`, computes the adjacent stage by index (`±1`, clamped at the array ends — no wraparound), and returns the coordinates of that column's own droppable rect (`droppableRects.get(stage)`, registered by `StageColumn`'s `useDroppable({ id: stage })`) — landing on the column droppable directly, the same `over.id === stage` path `handleDragEnd` already handles for "drop on empty column area" (`overIndex = destinationJobs.length`, i.e. appended to the end). A collapsed or unmounted target column (only `rejected` can collapse) is skipped, continuing in the same direction to the next stage.

Alternatives considered:

- _Tune the generic getter's filter to add row/vertical awareness._ Rejected — reimplementing generic corner-distance logic to special-case a fixed 5-column layout is more code and more fragile than addressing the columns directly by their known order.
- _Switch `collisionDetection` from `closestCenter` to `closestCorners` app-wide._ Rejected — doesn't fix the root cause (the coordinate getter still offers ambiguous candidates); would also change pointer-drag collision behavior, which isn't broken and isn't in scope.
- _Always drop at the end of the destination column via `ArrowRight`/`Left` (skip landing on a specific card)._ Accepted implicitly — cross-column keyboard moves have never supported picking a specific drop index (the pointer-drag path does); this fix doesn't add that, it only makes the existing "land on the column" behavior actually reachable by keyboard.

## Risks / Trade-offs

- **[Risk]** The exact reason `over` resolves to `null` was not isolated despite a CI-trace re-analysis and a local repro attempt (see Context) — it's confirmed to be an intermittent race, not confirmed to be _this specific_ mechanism → **Mitigation**: the fix doesn't depend on the mechanism being fully understood — landing directly on the target column's droppable removes the ambiguous candidate search entirely, which is the part of the current implementation most plausibly susceptible to a timing race. If the fix doesn't fully resolve the flake, that's a signal the race is elsewhere (e.g. `DragOverlay` mount/measurement timing) and worth a follow-up.
- **[Risk]** A custom coordinate getter is more test surface than reusing a library default → **Mitigation**: it's a small, pure function (stage lookup + rect lookup), and the existing e2e test already exercises exactly the path it needs to satisfy.
- **[Trade-off]** Landing cross-column moves always at "end of column" (no keyboard equivalent of pointer drag's precise drop-index) is a known, pre-existing limitation, not introduced by this fix — not resolving it keeps scope to the regression at hand.

## Migration Plan

No data or API migration. Single frontend file change (plus a new small helper), covered by the existing e2e test going from failing to passing. Roll back by reverting the `coordinateGetter` to `sortableKeyboardCoordinates` if a regression surfaces.

## Open Questions

- Confirm via the tasks.md spike whether `over` is truly `null`, or resolves to a wrong stage/card — the design above (land directly on the target column's droppable) is correct either way, but worth confirming before implementing to avoid a surprise second cause.
