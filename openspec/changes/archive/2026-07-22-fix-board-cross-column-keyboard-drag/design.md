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

Fix (first attempt): exclude the active item's own id from `droppableContainers` before running `closestCenter`, at the `DndContext`-level `collisionDetection`. Pushed as commit `6c4c1ae` — CI runs `29946620268` and its bare rerun (no code change) both confirmed the cross-column test now passes cleanly, 2/2, no retry needed.

**Investigation update (round 3): the round-2 fix broke a sibling test, and the actual cause was two separate, previously-hidden bugs.** Both CI runs above ALSO failed the _within-column_ reorder test — a test this change doesn't target — with an identical, deterministic wrong-order result on both attempts. Reading `sortableKeyboardCoordinates`'s source further (lines 725-729 of `sortable.esm.js`): it has its own built-in heuristic — `if (closestId === over?.id && collisions.length > 1) closestId = collisions[1].id` — meant to skip past "the candidate you're already hovering" so repeated same-direction presses keep advancing. That heuristic implicitly relies on `over` starting out as the active item's own id at lift (the natural zero-distance self-match from an _unfiltered_ `closestCenter`) as a "haven't moved yet" sentinel. Filtering the active id out of `collisionDetection` globally broke that sentinel: the initial `over` now resolves to the correct adjacent card immediately, which makes the "avoid re-selecting current over" heuristic think it's already hovering the right target and skip one further — landing one card too far on a single ArrowDown.

Fix (corrected): reverted `collisionDetection` to plain `closestCenter` (restoring `sortableKeyboardCoordinates`'s sentinel), and moved the self-collision guard to a narrow fallback inside `handleDragEnd` only — `resolveOverExcludingActive`, invoked only when the _final_ drop resolves to the active's own id, picking the next non-self entry from `event.collisions`. This fixes the same cross-column bug without touching the continuous `over` state `sortableKeyboardCoordinates` depends on throughout the drag.

With that corrected, the within-column test _still_ intermittently failed with the same wrong-order symptom — confirmed via direct local diagnostic logging to be entirely unrelated to collision detection (`over` resolved correctly to the adjacent card in every captured case; the self-collision fallback never even triggered for this path). Root cause: `handleDragEnd`'s within-column reorder computes `oldIndex`/`overIndex` against the _full_ "Saved" stage array — correct, intended app behavior, since a single ArrowDown press should move a card exactly one _visual_ position regardless of what else is in the column. But `board-reorder.spec.ts`'s `seededOrder()` helper only reads a title-filtered 3-job subset for its assertions, so any ambient (non-fixture) job sitting _between_ the two fixture cards being swapped breaks the test's assumption that one ArrowDown always swaps with "the next fixture job". Confirmed by deliberately placing a real leftover local job directly between the two fixture cards — reproduced the exact failure every time — and confirmed fixed by adding `clearAmbientSavedJobs` to the test (moves any non-fixture "Saved" job to `withdrawn` via the browser's own `/api` session before the reorder assertions run): 5/5 clean with the adversarial job present, 8/10 clean in a full-suite regression (remaining 2 failures were the pre-existing, already-documented reload-persistence bug and local-only setup-timeout flake, neither the target symptom). This was a test-isolation gap, not an app bug — the app's reorder logic was correct all along.

The round-1 `boardKeyboardCoordinates` change (landing cross-column moves directly on the target column's droppable, rather than `sortableKeyboardCoordinates`'s ambiguous corner search) is kept — it's still a real improvement independent of the self-collision bug — but it was never, by itself, the fix for the original CI failure.

## Goals / Non-Goals

**Goals:**

- `ArrowRight`/`ArrowLeft` after a space-lift deterministically moves the active card into the next/previous column in `BOARD_STAGES` order, landing on a real drop target every time (never a null `over`), matching the existing `stage-board` spec's keyboard-accessible requirement.
- `ArrowUp`/`ArrowDown` within-column reorder keeps working exactly as today — the app logic here was never broken; only the e2e test's isolation from ambient "Saved" data needed hardening (see round 3 in Context).
- No change to pointer/mouse drag, drop-index placement, optimistic updates, or the undo affordance.

**Non-Goals:**

- Not fixing or tuning `@dnd-kit/sortable`'s generic `sortableKeyboardCoordinates` in place — replacing it for the cross-column case is simpler and removes the ambiguity rather than papering over it.
- Not changing collapsed-column behavior (Rejected stays collapse-only; a collapsed column is not a valid keyboard-move target, same as today implicitly via `SortableContext` not rendering when collapsed).
- Not re-litigating the `stage-board` spec — the target behavior is already specified; this is a bug fix.

## Decisions

**Decision: resolve self-collision only at the final drop, inside `handleDragEnd`, not in `DndContext`'s shared `collisionDetection`.**

`resolveOverExcludingActive(collisions, activeId)` finds the first entry in `event.collisions` that isn't the active item's own id, used only when `event.over?.id === event.active.id`. `collisionDetection` stays plain `closestCenter` — unmodified, so `sortableKeyboardCoordinates`'s own internal collision pass (and its "avoid re-selecting current over" heuristic) keeps working exactly as the library intends. This is narrower than the round-2 attempt (filtering `collisionDetection` globally) but avoids that attempt's side effect on within-column reorder.

**Decision: add `clearAmbientSavedJobs` to `board-reorder.spec.ts`'s test setup, not to the app.**

The within-column wrong-order bug was a test-isolation gap, not an app bug — `handleDragEnd`'s full-array reorder logic is correct for a real user's real board (a single ArrowDown moves exactly one visual position, whatever else is in the column). The fix belongs in the test: before the reorder assertions run, move any "Saved" job that isn't one of the three CI fixtures to `withdrawn`, guaranteeing the column contains only the fixtures whenever the test's filtered-view assumptions matter.

**Decision (round 1, kept): replace the `KeyboardSensor`'s `coordinateGetter` with a board-specific one, not a patched/tuned generic one.**

The new getter:

- On `ArrowUp`/`ArrowDown`: delegates to the existing `sortableKeyboardCoordinates` (unaffected path, already correct — `board-reorder.spec.ts`'s within-column test already passes against it).
- On `ArrowLeft`/`ArrowRight`: looks up the active card's current column via `BOARD_STAGES`, computes the adjacent stage by index (`±1`, clamped at the array ends — no wraparound), and returns the coordinates of that column's own droppable rect (`droppableRects.get(stage)`, registered by `StageColumn`'s `useDroppable({ id: stage })`) — landing on the column droppable directly, the same `over.id === stage` path `handleDragEnd` already handles for "drop on empty column area" (`overIndex = destinationJobs.length`, i.e. appended to the end). A collapsed or unmounted target column (only `rejected` can collapse) is skipped, continuing in the same direction to the next stage. This remains a real improvement (removes the ambiguous corner-distance search for cross-column moves) but round 2 confirmed it was never, by itself, the fix for the CI failure — that was the self-collision bug above, independent of which coordinate getter is in use.

Alternatives considered:

- _Tune the generic getter's filter to add row/vertical awareness._ Rejected — reimplementing generic corner-distance logic to special-case a fixed 5-column layout is more code and more fragile than addressing the columns directly by their known order.
- _Switch `collisionDetection` from `closestCenter` to `closestCorners` app-wide._ Rejected — doesn't address self-collision (an item's own corners are just as "closest" to itself as its center); would also change pointer-drag collision behavior, which isn't broken and isn't in scope.
- _Filter the active id out of `DndContext`'s `collisionDetection` globally._ Tried and rejected (round 2) — fixes cross-column self-collision but breaks `sortableKeyboardCoordinates`'s own "avoid re-selecting current over" heuristic for within-column moves, since that heuristic depends on the unfiltered self-match at lift as a sentinel. The narrower `handleDragEnd`-only fallback achieves the same cross-column fix without disturbing it.
- _Always drop at the end of the destination column via `ArrowRight`/`Left` (skip landing on a specific card)._ Accepted implicitly — cross-column keyboard moves have never supported picking a specific drop index (the pointer-drag path does); this fix doesn't add that, it only makes the existing "land on the column" behavior actually reachable by keyboard.
- _Fix the within-column wrong-order bug in the app (e.g. filter `destinationJobs` to visually-adjacent-only, or reject ambient jobs from the reorder computation)._ Rejected — the app's behavior (move exactly one visual position per ArrowDown, among whatever's really in the column) is correct for a real user's real board; narrowing it to satisfy a test's isolation assumption would make the feature worse for actual multi-job columns. Fixed in the test instead.

## Risks / Trade-offs

- **[Risk]** A custom coordinate getter is more test surface than reusing a library default → **Mitigation**: it's a small, pure function (stage lookup + rect lookup), and the existing e2e test already exercises exactly the path it needs to satisfy.
- **[Trade-off]** Landing cross-column moves always at "end of column" (no keyboard equivalent of pointer drag's precise drop-index) is a known, pre-existing limitation, not introduced by this fix — not resolving it keeps scope to the regression at hand.
- **[Risk]** `clearAmbientSavedJobs` adds two extra API requests (`/api/profiles/active`, `/api/jobs?reaction=saved...`) plus one per ambient job found, at the start of every `seedSavedColumn` call → **Mitigation**: guarded with `response.ok` checks that skip cleanup silently on a non-2xx response (e.g. a transient rate-limit hit under heavy local `--repeat-each` stress-testing) rather than throwing and failing the test for an unrelated reason; CI's single run per commit is far below the API's rate limit regardless.

## Migration Plan

No data or API migration. Two files changed: `stage-board.tsx` (app fix) and `board-reorder.spec.ts` (test-isolation fix), both covered by the existing e2e tests going from failing to passing. Roll back the app fix by reverting `resolveOverExcludingActive`'s call site in `handleDragEnd` to plain `event.over?.id`; roll back the test fix by removing the `clearAmbientSavedJobs` call in `seedSavedColumn` if either regresses.

## Open Questions

None — resolved via round-2/3 diagnostic-logging trace evidence: the cross-column bug via `over.id === active.id` (a self-collision), and the within-column bug via direct local capture of `destinationJobs`/`oldIndex`/`overIndex` plus a deliberately-reproduced adversarial ambient-job placement; see Context.
