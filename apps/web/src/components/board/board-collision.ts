/**
 * @module components/board/board-collision
 *
 * Pointer-first collision detection for the stage board (design.md D1 in
 * openspec/changes/improve-board-dnd-perf). `closestCenter` picks by center
 * distance, which misfires near column boundaries; `pointerWithin` resolves
 * to whatever the pointer is actually over instead.
 */
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
