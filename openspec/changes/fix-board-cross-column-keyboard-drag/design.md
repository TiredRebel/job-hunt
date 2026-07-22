## Context

`/board`'s `StageBoard` (`apps/web/src/components/board/stage-board.tsx`) wires one `DndContext` over five stage columns. Each column is both a `useDroppable({ id: stage })` container and, for its cards, a `@dnd-kit/sortable` `SortableContext`. The `KeyboardSensor` uses `@dnd-kit/sortable`'s stock `sortableKeyboardCoordinates` as its `coordinateGetter`.

Confirmed via a CI trace (`board-reorder.spec.ts`'s "cross-column keyboard drag" test): space-lift → `ArrowRight` → space-drop announces `"Move cancelled"` instead of moving the card. `handleDragEnd` in `stage-board.tsx` takes that branch precisely when `event.over` is `null`/`undefined` — so the keyboard sensor's virtual position after `ArrowRight` is landing somewhere `closestCenter` (the `DndContext`'s configured collision detector) resolves to no droppable at all.

Reading `sortableKeyboardCoordinates`'s actual source (`node_modules/@dnd-kit/sortable/dist/sortable.esm.js`): on `ArrowRight` it filters `droppableContainers.getEnabled()` to those with `rect.left > collisionRect.left` (i.e. _any_ droppable further right, not just the adjacent column — the filter has no vertical/row awareness), then picks among them with `closestCorners`. In a 5-column board this makes Interview/Offer/Rejected valid candidates alongside Applied on every rightward press, and the corner-distance heuristic is the only thing keeping the "wrong" column from winning. It's a general-purpose heuristic built for grids/free-form drop zones, not a fixed, ordered set of columns — exactly the class of layout `@dnd-kit`'s own "Multiple Containers" example replaces with a custom coordinate getter, rather than trying to tune the generic one.

**Investigation update (post-spike, round 1): this looked like an intermittent race, not a deterministic pick of the wrong column.** Manual reproduction in a real browser (two attempts) and 8 local headless-Playwright runs against the dev stack passed 7/8 times; only one local run failed, and it failed differently (a setup-phase locator timeout, not `"Move cancelled"` — consistent with local test-harness overload from rapid repeated runs, not the bug itself). Re-examining the original CI trace's `before`/`after` action log and network log for the exact failing sequence: `event.over` resolves to `null`-_looking_ essentially instantly on drop (the `aria-live` region already reads `"Move cancelled"` within ~8ms of the drop keypress), and there is no API/query-refetch activity anywhere near the gesture — ruling out a query-invalidation-driven DOM remount racing the drag. Landed a first fix (commit `0de7015`): replace `sortableKeyboardCoordinates`'s ambiguous multi-candidate corner search with a direct single-target droppable lookup (`droppableRects.get(stage)`). 20/20 local executions passed. **CI still failed the same way afterward** (run `29941837428`) — the fix didn't hold outside the local environment.

**Investigation update (round 2): root cause found via direct trace evidence, not further inference.** Rather than theorize again, added temporary diagnostic logging (commit `9633e8f`) directly inside the coordinate getter and `handleDragEnd`, logging the resolved target rect and `event.over`/`event.collisions`, and pushed it to reproduce the failure in CI with hard data instead of a guess. The CI trace (run `29945019050`) showed:

```
[diag-cross-col] coordinateGetter {direction: ArrowRight, fromStage: saved, candidateStage: applied, cachedRectHit: true, rect: {...}}
[diag-cross-col] dragEnd {activeId: 2, overId: 2, collisions: Array(8)}
```

`over.id` **equals `active.id`** — a self-collision, not a null `over`. This also retroactively falsifies the round-1 theory: the coordinate getter _did_ resolve a real, valid rect for the `applied` column (`cachedRectHit: true`); the earlier "stale cache" fix was solving a problem that wasn't happening.

The actual mechanism: `StageCard` uses `useSortable({ id: job.id })`, which registers **every** card as both a draggable and a droppable under its own job id — including the card currently being dragged, since its original (dimmed) DOM element stays mounted at its old position for the whole drag. `@dnd-kit/core`'s `closestCenter` does not exclude the active item's own droppable from consideration by default (a documented `@dnd-kit` gotcha). A keyboard move whose computed virtual position ends up closer to the card's own old center than to the target column's center resolves `over` back to the card itself. `handleDragEnd` then takes the _same-stage_ branch (`fromStage === toStage`, both resolving to the origin stage since `over` is the active job), finds `oldIndex === overIndex`, and announces `"Move cancelled"` via that no-op guard — a different code path than originally assumed, producing an identical-looking symptom.

Fix: exclude the active item's own id from `droppableContainers` before running `closestCenter`, at the `DndContext`-level `collisionDetection`, not just inside the keyboard coordinate getter — this closes the self-collision hole for any sensor, not only keyboard. The round-1 `boardKeyboardCoordinates` change (landing cross-column moves directly on the target column's droppable, rather than `sortableKeyboardCoordinates`'s ambiguous corner search) is kept — it's still a real improvement independent of this bug — but it was never the fix for the CI failure.

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

**Decision: exclude the active item's own id from `collisionDetection`, at the `DndContext` level.**

`excludeActiveDroppable` wraps `closestCenter`, filtering `args.droppableContainers` to drop any container whose id matches `args.active.id` before delegating. This is the actual fix (round 2) — it closes the self-collision hole for every sensor (pointer and keyboard), not just the keyboard path, since any drag could in principle land back on the active card's own still-mounted droppable.

**Decision (round 1, kept): replace the `KeyboardSensor`'s `coordinateGetter` with a board-specific one, not a patched/tuned generic one.**

The new getter:

- On `ArrowUp`/`ArrowDown`: delegates to the existing `sortableKeyboardCoordinates` (unaffected path, already correct — `board-reorder.spec.ts`'s within-column test already passes against it).
- On `ArrowLeft`/`ArrowRight`: looks up the active card's current column via `BOARD_STAGES`, computes the adjacent stage by index (`±1`, clamped at the array ends — no wraparound), and returns the coordinates of that column's own droppable rect (`droppableRects.get(stage)`, registered by `StageColumn`'s `useDroppable({ id: stage })`) — landing on the column droppable directly, the same `over.id === stage` path `handleDragEnd` already handles for "drop on empty column area" (`overIndex = destinationJobs.length`, i.e. appended to the end). A collapsed or unmounted target column (only `rejected` can collapse) is skipped, continuing in the same direction to the next stage. This remains a real improvement (removes the ambiguous corner-distance search for cross-column moves) but round 2 confirmed it was never, by itself, the fix for the CI failure — that was the self-collision bug above, independent of which coordinate getter is in use.

Alternatives considered:

- _Tune the generic getter's filter to add row/vertical awareness._ Rejected — reimplementing generic corner-distance logic to special-case a fixed 5-column layout is more code and more fragile than addressing the columns directly by their known order.
- _Switch `collisionDetection` from `closestCenter` to `closestCorners` app-wide._ Rejected — doesn't address self-collision (an item's own corners are just as "closest" to itself as its center); would also change pointer-drag collision behavior, which isn't broken and isn't in scope.
- _Filter self-collision only inside `boardKeyboardCoordinates`._ Rejected — the coordinate getter only picks a target position, it doesn't run collision detection; the self-collision happens later, in `closestCenter` itself, so the fix has to live at the `collisionDetection` level to cover pointer drags too, not just keyboard.
- _Always drop at the end of the destination column via `ArrowRight`/`Left` (skip landing on a specific card)._ Accepted implicitly — cross-column keyboard moves have never supported picking a specific drop index (the pointer-drag path does); this fix doesn't add that, it only makes the existing "land on the column" behavior actually reachable by keyboard.

## Risks / Trade-offs

- **[Risk]** A custom `collisionDetection` wrapper runs on every pointer-move frame during a drag (not just keyboard presses) → **Mitigation**: it's a single `Array.filter` over `droppableContainers` (already a small, bounded list — one entry per column plus one per visible card) before delegating entirely to `closestCenter`; no measurable overhead expected, and pointer drag is exercised by existing manual/e2e coverage.
- **[Risk]** A custom coordinate getter is more test surface than reusing a library default → **Mitigation**: it's a small, pure function (stage lookup + rect lookup), and the existing e2e test already exercises exactly the path it needs to satisfy.
- **[Trade-off]** Landing cross-column moves always at "end of column" (no keyboard equivalent of pointer drag's precise drop-index) is a known, pre-existing limitation, not introduced by this fix — not resolving it keeps scope to the regression at hand.

## Migration Plan

No data or API migration. Single frontend file change, covered by the existing e2e test going from failing to passing. Roll back by reverting `collisionDetection` to `closestCenter` (and, separately, `coordinateGetter` to `sortableKeyboardCoordinates`) if a regression surfaces.

## Open Questions

None — resolved via round-2 diagnostic-logging trace evidence (`over.id === active.id`, a self-collision); see Context.
