## 1. Collision detector + precision tests (D1, D3)

- [x] 1.1 Create `apps/web/src/components/board/board-collision.ts` with the exact `boardCollisionDetection` snippet from design.md D1
- [x] 1.2 Create `apps/web/src/components/board/board-collision.spec.ts` with the 5 cases from design.md D3 (boundary, on-card, empty-column, null-pointer ≡ closestCenter, gap → rectIntersection), using the `container()` fake from D3 — verify: `npm run test -w web -- board-collision` green
- [x] 1.3 In `stage-board.tsx`: import `boardCollisionDetection`, set `collisionDetection={boardCollisionDetection}` on `DndContext`, remove the now-unused `closestCenter` import; leave `resolveOverExcludingActive` untouched — verify: `npm run typecheck -w web` green

## 2. Render memoization (D2)

- [x] 2.1 `stage-card.tsx`: rename the component function to `StageCardInner`, export `const StageCard = memo(StageCardInner);` — verify: `npm run typecheck -w web`
- [x] 2.2 `stage-board.tsx`: replace the `useQueries` call and the `jobsByStage` `useMemo` with the `combine` snippet from design.md D2; switch column props to `loading={loadingByStage.get(stage) ?? false}`; update `findStageForJob`/`boardKeyboardCoordinates` deps to the new `jobsByStage` — verify: `npm run typecheck -w web`
- [x] 2.3 `stage-board.tsx`: wrap `handleDragStart`, `handleDragEnd`, and the inline `onDragCancel` in `useCallback` (deps per react-hooks lint) — verify: `npm run lint -w web` green
- [x] 2.4 `stage-column.tsx`: `const itemIds = useMemo(() => jobs.map((job) => job.id), [jobs]);`, pass `items={itemIds}` — verify: `npm run typecheck -w web`

## 3. Render-count harness (D3)

- [x] 3.1 Create `apps/web/src/components/board/stage-board.perf.spec.tsx` with the counting probe from design.md D3 on `@/components/score-badge` (scope changed from the full board to an isolated `StageCard` harness — see tasks.md note below)
- [x] 3.2 Assert the memoized card doesn't re-render when an unrelated ancestor re-renders — verify: `npm run test -w web -- stage-board.perf` green (confirmed it fails if 2.1's `memo()` is reverted, then restored)

> **Deviation from the D3 plan:** the original "expand/collapse Rejected, assert `probe.renders === 0`" scenario was implemented and run — it failed at 200s→500s+ render counts, not because memoization is broken, but because dnd-kit's `SortableContext`/`DndContext` share one board-wide `droppableRects`/registry context: mounting or unmounting _any_ droppable (which column collapse does, via its `{!collapsed && <SortableContext>...}` conditional) invalidates that shared context and forces every mounted card to re-render through context propagation, which `React.memo` cannot block (memo only bails on prop-driven re-renders, not context-driven ones). This is an architectural property of dnd-kit itself, not something in this change's scope to fix (would need per-column `DndContext` isolation, breaking cross-column drag). The harness was rescoped to what D2 actually guarantees and can prove: a `StageCard` with referentially-stable props does not re-render when an unrelated ancestor re-renders, with no droppable mount/unmount involved. `specs/stage-board/spec.md`'s "Collapse toggle re-renders no other cards" scenario is not met by this implementation and should be revisited (retitled or removed) — flagged here rather than edited unilaterally.

> **Drag-start architectural finding (follow-up investigation, not itself an
> original 3.x/4.x task):** the isolated harness above proves memoization
> works in a vacuum, but doesn't prove it works for the trigger this whole
> change is about — an actual drag. Tested empirically: rendered the real
> `StageBoard` with 3 jobs across 3 columns, lifted a card via the
> `KeyboardSensor` (`fireEvent.keyDown(cardEl, { code: 'Space' })` — this
> fires `onDragStart` synchronously with no dependency on jsdom's zeroed
> `getBoundingClientRect`, unlike a pointer drag), and counted `ScoreBadge`
> calls per card (a leaf-probe render proxy, same technique as 3.1/3.2).
> Result: **other-column cards re-rendered 4 times each** on a single lift —
> not zero.
>
> First hypothesis (wrong hypothesis, but a real independent bug — kept the
> fix): `handleDeleteJob` and `handleDragEnd` depended on the _whole_
> `deleteMutation`/`reorderMutation`/`moveMutation` objects from
> `useMutation()`, not their `.mutate` functions. `useMutation`'s source
> (`@tanstack/react-query/build/modern/useMutation.js:40`,
> `return { ...result, mutate, mutateAsync: result.mutate }`) returns a
> **new object every render** even when nothing changed, which silently
> defeated `useCallback` and, downstream, `StageCard`'s `memo` on the
> `onDeleteJob` prop. Fixed in `stage-board.tsx`: bound `.mutate` to a plain
> local (`deleteJobMutate`, `reorderJobsMutate`, `moveJobMutate`) and
> depend on those instead of the mutation objects — verified clean via
> `npm run typecheck -w web` and `npm run lint -w web` (0 errors, back to
> the 2 pre-existing unrelated warnings). **This fix is real and stays**,
> but re-running the drag-start measurement after it produced the _same_
> render counts (4 per other-column card) — proving it wasn't the
> bottleneck for this specific symptom.
>
> Actual root cause (confirmed against `@dnd-kit/core`'s source,
> `core.esm.js` ~L3337–3360): `DndContext` computes one memoized
> `internalContext` object — containing `active`, `over`, `activatorEvent`,
> etc. — and provides it via a single `InternalContext.Provider` wrapping
> **all of `children`**, i.e. the entire board, all 5 columns. Every
> `useSortable`/`useDroppable` call (every mounted `StageCard`, every
> `StageColumn`) subscribes to that one context via `useContext`. When a
> drag starts, `active` changes, `internalContext` is recomputed, and
> **every subscriber re-renders — React Context propagation is unconditional
> and bypasses `React.memo` entirely**; `memo` only blocks re-renders
> triggered by a re-rendering _parent_ passing identical props, never
> re-renders triggered by the component's own `useContext` subscription.
> This is the same category of issue 3.1/3.2's deviation note already found
> for column-collapse (shared context forcing re-renders memo can't stop) —
> it turns out it also applies to a plain drag-start with zero mounts/
> unmounts, because the shared context itself changes value, not just its
> consumer tree.
>
> **Consequence for this change's stated success criteria:** "cards render
> zero times on board state updates" (design.md D2/specs
> "Board state updates do not re-render unchanged cards") is **not
> achievable via component memoization** as long as `StageCard` uses
> `useSortable` inside one shared `DndContext` — which is required for
> cross-column drag to work at all. Splitting `DndContext` per column would
> avoid the shared-context re-renders but breaks cross-column drag (dnd-kit
> needs one `DndContext` to coordinate drops across containers) — out of
> this change's scope, not attempted.
>
> Diagnostic test added and then skipped (not deleted, so the reproduction
> is preserved for whoever revisits this):
> `apps/web/src/components/board/stage-board-drag-start.perf.spec.tsx` —
> `describe.skip` with the full explanation inline. `npm run test -w web`
> is green (25 passed, 1 skipped) with it in place.
>
> **Resolved (user decision):** redefine the speed criterion around render
> _cost_, not render _count_ — option (a). `specs/stage-board/spec.md`'s
> requirement is now "Card re-renders triggered by a drag stay cheap and
> bounded"; `design.md` has a D2 addendum with the full root-cause writeup
> and the resulting decision. Remaining work: convert the skipped
> `stage-board-drag-start.perf.spec.tsx` diagnostic into a real (unskipped)
> regression guard per the redefined requirement — see 3.3 below.

- [x] 3.3 Un-skip `stage-board-drag-start.perf.spec.tsx`'s `describe.skip` → `describe`; change its final assertions from `toBe(0)` to: re-render count `> 0` (documents the architectural floor) AND `<=` a small fixed bound, e.g. 5 (regression guard). Update the file's header comment to match design.md's D2 addendum framing instead of "SKIPPED — empirically fails". Run `npm run test -w web -- stage-board` and get it green. — verified: measured other-column re-render count is within (0, 5]; both cards pass the bound.

## 4. Converge via /loop (D4)

- [x] 4.1 Full web suite converged green without needing any fix-iterations: `npm run test -w web` → 25 files, 136 tests, exit 0 (26 files / 137 tests including the new skipped drag-start diagnostic, after the drag-start investigation above)

## 5. Verify

- [x] 5.1 `npm run check` (lint + typecheck + test via turbo) green at repo root — 10/10 tasks successful; web suite 137/137 tests passed; lint 0 errors (2 pre-existing warnings in unrelated files: stage-column.tsx's useVirtualizer and job-table.tsx's useReactTable, both React Compiler incompatible-library notices predating this change)
- [x] 5.2 Manual smoke in the running app (local `next dev -p 3100` against the already-running `jh-api` gateway, real dev-profile data): pointer drag of "Python Developer (Automation)" from Applied to Interview landed correctly on empty column space (toast "Stage updated", card appeared in Interview); keyboard cross-column move (Space to lift, ArrowLeft, Space to drop) moved it back to Applied correctly, restoring original state. No console errors. **Not verifiable manually**: "drop on a card" and "drop near a column boundary between two populated columns" — the dev-profile board only has one job total, so no column has 2+ cards to drop onto or straddle a boundary against. Both scenarios are covered by `board-collision.spec.ts`'s automated unit tests (on-card and boundary cases with synthetic containers), which is the primary verification for those two per design.md D3 — manual smoke was supplementary real-world confidence for the two scenarios actual data allowed.
