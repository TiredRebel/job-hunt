## Why

Keyboard-driven cross-column moves on `/board` are broken: lifting a card with space and pressing an arrow key toward an adjacent column announces "Move cancelled" instead of moving the card, even though the identical mouse/pointer drag works correctly. This was previously masked in CI by an unrelated e2e hydration-timing bug that failed the same test earlier in its run; with that fixed, the test now runs far enough to expose this as a real, reproducible bug — confirmed via a CI trace and root-caused to the drag library configuration, not test flakiness. It silently violates the already-shipped `stage-board` spec's "Keyboard-accessible drag and drop" requirement, so this is a regression fix, not new scope.

## What Changes

- Replace the keyboard sensor's `coordinateGetter` on `/board` with one that accounts for cross-column geometry, instead of `@dnd-kit/sortable`'s stock `sortableKeyboardCoordinates` (which only computes positions within the active column's own sortable list and returns no valid position when the target is a different column — `dnd-kit`'s own "Multiple Containers" pattern exists for exactly this).
- No other drag behavior changes: pointer drag, within-column keyboard reorder, drop-index placement, and the undo affordance are unaffected.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — the `stage-board` spec's existing "Keyboard-accessible drag and drop" requirement already specifies this exact behavior; this change fixes the implementation to match it, it does not change the requirement.)

## Impact

- `apps/web/src/components/board/stage-board.tsx` — the `KeyboardSensor`'s `coordinateGetter`.
- No API, schema, or other component changes.
- Existing e2e coverage (`apps/web/e2e/board-reorder.spec.ts`'s "cross-column keyboard drag persists the new stage") already exercises this path and is expected to go from failing to passing; no new spec scenario is needed since the current one already describes the fixed behavior.
