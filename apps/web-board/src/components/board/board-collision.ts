/**
 * @module components/board/board-collision
 *
 * closestCenter against a rect map snapshotted at drag start
 * (docs/jobs-redesign.md §6.2). No getBoundingClientRect in the
 * pointer-move path — dnd-kit's MeasuringStrategy.BeforeDragging feeds
 * droppableRects once; call `invalidateBoardCollisionCache` after column
 * scroll/resize to re-snapshot.
 */
import {
  closestCenter,
  type ClientRect,
  type CollisionDetection,
  type UniqueIdentifier,
} from '@dnd-kit/core';

let cachedRects: Map<UniqueIdentifier, ClientRect> | null = null;
let cacheGeneration = 0;

/**
 * Drop the cached rect map so the next collision pass re-snapshots
 * (column scroll / resize during drag).
 */
export function invalidateBoardCollisionCache(): void {
  cachedRects = null;
  cacheGeneration += 1;
}

/**
 * Snapshot droppableRects on first use of a drag (or after invalidate),
 * then run closestCenter against that frozen map.
 */
export const boardCollisionDetection: CollisionDetection = (args) => {
  if (!cachedRects || cachedRects.size !== args.droppableRects.size) {
    cachedRects = new Map(args.droppableRects);
  }

  return closestCenter({
    ...args,
    droppableRects: cachedRects,
  });
};

/** Test helper — current cache generation (increments on invalidate). */
export function boardCollisionCacheGeneration(): number {
  return cacheGeneration;
}
