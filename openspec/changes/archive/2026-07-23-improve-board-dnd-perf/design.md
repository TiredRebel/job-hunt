## Context

`StageBoard` (apps/web/src/components/board/stage-board.tsx) wires dnd-kit with `collisionDetection={closestCenter}`. Every card is a `useSortable` droppable, so a full board exposes ~500 droppables; `closestCenter` picks by center distance, which misfires near column boundaries and made the `resolveOverExcludingActive` self-collision workaround necessary. On the render side, `useQueries` returns a fresh array every render, so `jobsByStage` and everything downstream recomputes per render; `StageCard` is unmemoized, so any board re-render (drag start, live-region update, collapse toggle) re-renders every mounted card; drag handlers are recreated every render.

Stack facts (verified): `@tanstack/react-query` 5.x (`combine` available), `@dnd-kit/core` 6.3.x, tests are co-located `*.spec.tsx` run by vitest (`npm run test -w web`), existing component-test harness patterns live in `apps/web/src/components/jobs/jobs-client.spec.tsx` (QueryClient + next-intl providers, API mocks).

## Goals / Non-Goals

**Goals:**

- Drop target = what's under the pointer (precision criterion).
- Card re-renders triggered by a drag stay cheap and bounded (speed criterion — see D2 addendum: re-render _count_ during a drag has an architectural floor this change cannot remove; re-render _cost_ and ordinary prop-driven re-render propagation are what's controlled here).
- Every step verifiable by a runnable command; implementation loops verify→fix via `/loop` with a hard stop.

**Non-Goals:**

- No API/backend changes, no new dependencies, no visual redesign.
- No change to keyboard-drag behavior (fixed in fix-board-cross-column-keyboard-drag; `resolveOverExcludingActive` stays).
- No change to virtualization thresholds or mutation/optimistic-update logic.

## Decisions

**D1 — Collision strategy: pointer-first, keyboard unchanged.**
New module `apps/web/src/components/board/board-collision.ts` (own file so unit tests import it without pulling the `'use client'` board tree):

```ts
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';

/** Pointer drags: what's under the pointer wins; keyboard drags keep closestCenter. */
export const boardCollisionDetection: CollisionDetection = (args) => {
  if (!args.pointerCoordinates) {
    return closestCenter(args); // keyboard — preserves sortableKeyboardCoordinates behavior
  }
  const within = pointerWithin(args);
  return within.length > 0 ? within : rectIntersection(args);
};
```

Wire with `collisionDetection={boardCollisionDetection}` in `DndContext`. Keyboard path is byte-identical to today (null `pointerCoordinates` → `closestCenter`), so the existing keyboard fix and `resolveOverExcludingActive` guard are untouched.
_Alternative considered:_ `closestCorners` (dnd-kit's kanban suggestion) — still distance-based, still boundary-misfires and self-collides for pointer input.

**D2 — Memoize render path, don't restructure it.**

- `stage-card.tsx`: rename the function to `StageCardInner`, add `export const StageCard = memo(StageCardInner);` (`memo` from `react`). Props are memo-safe: `job` refs come from the query cache, `dragging` is boolean, `onDeleteJob` is already a `useCallback` in the board.
- `stage-board.tsx`: replace the `useQueries` call + `jobsByStage` memo with `combine` (runs only when underlying results change, output identity is stable between changes):

```ts
const { jobsByStage, loadingByStage } = useQueries({
  queries: BOARD_STAGES.map((stage) => ({
    queryKey: queryKeys.jobs.list(stageQueryParams(stage)),
    queryFn: ({ signal }: { signal?: AbortSignal }) => listJobs(stageQueryParams(stage), signal),
  })),
  combine: (results) => ({
    jobsByStage: new Map<BoardStage, Job[]>(
      BOARD_STAGES.map((stage, index) => [stage, results[index]?.data?.items ?? []]),
    ),
    loadingByStage: new Map<BoardStage, boolean>(
      BOARD_STAGES.map((stage, index) => [stage, results[index]?.isLoading ?? false]),
    ),
  }),
});
```

Column render uses `loading={loadingByStage.get(stage) ?? false}` (the per-index `stageQueries[index]?.isLoading` access disappears with the array).

- `stage-board.tsx`: wrap `handleDragStart`, `handleDragEnd`, and the `onDragCancel` handler in `useCallback` (deps per react-hooks lint; `mutation.mutate` references are stable in v5).
- `stage-column.tsx`: `const itemIds = useMemo(() => jobs.map((job) => job.id), [jobs]);` and pass `items={itemIds}`.
  _Alternative considered:_ isolating drag state in a store/context — more surgery, same render counts; memo gets there in ~10 lines.

**D2 addendum — the render-count floor, found during apply, and the resulting scope decision.**
Two triggers were measured empirically against the real `StageBoard` (not a synthetic harness) after D2 landed:

1. _Column collapse_ (`{!collapsed && <SortableContext>...}`) unmounts a droppable, invalidating dnd-kit's shared droppable-registry context — every mounted card re-rendered (200s→500s+ on a full board).
2. _Drag start_ (`setActiveJob`/`setLiveMessage`, no mounts/unmounts) still re-rendered every other-column card 4 times each.

Root cause for both, confirmed against `@dnd-kit/core` source (`core.esm.js` ~L3337–3360): `DndContext` provides one memoized context object (`active`, `over`, `activatorEvent`, …) via a single `Provider` wrapping the entire board; every `useSortable`/`useDroppable` subscribes via `useContext`. **React Context propagation re-renders every subscriber unconditionally and bypasses `React.memo` entirely** — memo only blocks a re-rendering _parent_ from propagating identical props, never a component's own context subscription firing. Splitting `DndContext` per column would dodge this but breaks cross-column drag (dnd-kit needs one context to coordinate drops across containers) — out of scope.

Decision (user-confirmed): redefine the speed criterion around render _cost_, not render _count_. Concretely:

- Accept the Context-driven re-render count as a documented architectural ceiling, not a bug this change fixes.
- Keep `React.memo`/`combine`/`useCallback` from D2 — they still do real work: they block _ordinary prop-driven_ re-render propagation (e.g. an unrelated sibling re-rendering with stable props), and they close a real bug found during apply (see below).
- Real bug found and fixed during apply, kept: `handleDeleteJob`/`handleDragEnd` depended on whole `useMutation()` result objects, which `@tanstack/react-query` recreates every render (`useMutation.js:40`) even when nothing changed — silently defeating `useCallback` and, downstream, `StageCard`'s memo. Fixed by binding `.mutate` to plain locals (`deleteJobMutate`, `reorderJobsMutate`, `moveJobMutate`) and depending on those instead of the mutation objects.
- Guard against regression instead of chasing zero: assert (a) a stable-prop parent re-render still causes zero re-renders on an unrelated card (proves memo/combine/useCallback are doing their job), and (b) drag-start's re-render count on other-column cards stays at a small bounded number rather than growing unbounded (catches a future change that makes the Context-propagation cost worse, without pretending it can be zero).
- Per-card render cost audit: `daysSince()` (Date parse + subtraction) and the rest of `StageCardInner`'s render body are already O(1) constant-time — no per-render network calls, no unbounded loops, nothing to trim further.

**D3 — Measurement harness: leaf render probe + collision unit tests. No timing assertions.**
jsdom timings are noise and simulating full dnd-kit pointer drags in jsdom is unreliable, so the deterministic proxy is _render counts_, split into two checks matching the D2 addendum's two guarantees:

- **Prop-driven isolation** (`stage-board.perf.spec.tsx`): a minimal `StageCard` wrapped in its own `DndContext`/`SortableContext`, with an unrelated sibling `tick` state. Mock `@/components/score-badge` with a counting stub (`ScoreBadge` is a leaf inside every card, so its call count == card render count — no prod instrumentation):

```ts
const probe = { renders: 0 };
vi.mock('@/components/score-badge', () => ({
  ScoreBadge: () => {
    probe.renders += 1;
    return null;
  },
}));
```

Render, let mount settle, reset `probe.renders = 0`, click the unrelated `tick` button, assert `probe.renders === 0`. This fails if `StageCard`'s `memo()` is reverted and passes with it in place — proves ordinary prop-driven isolation works.

- **Drag-start bound** (`stage-board-drag-start.perf.spec.tsx`): renders the real `StageBoard`, keyboard-lifts a card (`fireEvent.keyDown(cardEl, { code: 'Space' })` — fires dnd-kit's `KeyboardSensor` activation synchronously, no dependency on jsdom's zeroed `getBoundingClientRect`), and asserts other-column cards' re-render count is `> 0` (documents the architectural floor, doesn't pretend it's zero) `&&` stays `<=` a small fixed bound (e.g. 5) — a regression guard, not a zero-count assertion.
- **Precision** (`board-collision.spec.ts`): call `boardCollisionDetection(args)` directly with synthetic containers:

```ts
function container(id: string, r: { top: number; left: number; width: number; height: number }) {
  const rect = { ...r, bottom: r.top + r.height, right: r.left + r.width };
  return {
    id,
    key: id,
    disabled: false,
    node: { current: null },
    data: { current: {} },
    rect: { current: rect },
  };
}
```

Cases: (1) pointer inside column A near the A/B boundary while the dragged rect's center is closer to B → first collision id is A; (2) pointer over a card → that card's id; (3) pointer over a column's empty area → the column id; (4) `pointerCoordinates: null` → result equals `closestCenter(args)`; (5) pointer in the gap between columns but dragged rect intersecting a column → that column (rectIntersection fallback).
_Alternative considered:_ Playwright + CDP frame tracing — flaky as a CI gate; keep real-browser feel for the manual smoke step only.

**D4 — Implementation loop.**
Apply runs tasks in order; after each group, `/loop` runs the mechanical cycle: `npm run test -w web` → if red, fix the named failure → rerun. Hard stop: suite green + probe asserts 0 + collision cases pass, or 5 iterations without progress (then stop and report). No "pick the next optimization" judgment — the optimization list is fixed (D1, D2), the loop only converges tests.

## Risks / Trade-offs

- [`pointerWithin` returns empty when the pointer is outside every droppable] → `rectIntersection` fallback on the dragged rect; if both empty, the drop genuinely isn't over the board (cancel is correct).
- [`memo` masks a needed re-render] → all StageCard props are stable refs or primitives; react-hooks lint enforces handler deps.
- [`combine` output rebuilt on any single query change re-renders all columns] → acceptable: data changes are rare (drag end, refetch) vs. per-render churn today; card memo absorbs the rest.
- [Virtualized columns (>50 cards) unmount off-screen sortables, so pointer drops below the overscan window hit the column droppable] → lands at column end, which matches the existing empty-area spec; unchanged from today.
- [ScoreBadge probe couples the perf test to StageCard's internals] → if StageCard ever drops ScoreBadge, the test fails loudly (0 initial renders) rather than silently passing.
- [dnd-kit's Context-propagation re-render floor could regress further (e.g. a future change adds another shared context, or the bound crept from 4 toward 50)] → the drag-start bounded-regression test (D2 addendum, D3) catches growth; it does not and cannot assert zero.

## Open Questions

_None — D1–D3 scope, including the D2 addendum, is closed. A per-column `DndContext` isolation spike (to remove the re-render floor entirely) is explicitly out of scope; if pursued, it is a separate change._
