## Why

Board drag-and-drop feels sluggish and imprecise: every `useSortable` card re-renders on each board re-render (no memoization, `jobsByStage` rebuilds every render because `useQueries` returns a fresh array), and `closestCenter` collision detection resolves drops by center distance — near column boundaries or over tall columns it picks the wrong card or column, which already forced the `resolveOverExcludingActive` workaround.

## What Changes

- Replace `closestCenter` with a pointer-first collision strategy (`pointerWithin` → `rectIntersection` fallback, `closestCenter` retained for keyboard drags) so the drop target is what's actually under the pointer.
- Cut render cost during drags: memoize `StageCard`, derive `jobsByStage` via `useQueries` `combine`, stabilize handlers — only cards whose props change re-render.
- Add a deterministic measurement harness: unit tests on the collision detector (precision) and a leaf-probe render-count test (speed proxy) that fails when unrelated cards re-render.
- No API, schema, or visual changes — same columns, cards, mutations, and keyboard behavior.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `stage-board`: add requirements that pointer drops resolve to the card/column under the pointer (precision) and that board state updates do not re-render unchanged cards (responsiveness), each backed by a repeatable check.

## Impact

- `apps/web/src/components/board/board-collision.ts` — new ~15-line module (collision detector, exported for unit tests).
- `apps/web/src/components/board/stage-board.tsx` — collision wiring, `combine`, `useCallback` on drag handlers.
- `apps/web/src/components/board/stage-card.tsx` — `React.memo`.
- `apps/web/src/components/board/stage-column.tsx` — memoized `SortableContext` items.
- New co-located `*.spec.ts(x)` tests. No backend, API, or dependency changes.

## Implementation notes

Artifacts are written for autonomous execution by a Sonnet 5 agent: design.md carries exact code snippets and fake-object shapes, tasks.md gives one verifiable edit per task with a runnable check (`npm run test -w web -- <file>`), and the `/loop` step is a mechanical verify→fix cycle with a hard stop condition — no open-ended judgment calls.
