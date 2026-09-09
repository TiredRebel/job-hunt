/**
 * @module components/board/board-collision.spec
 *
 * Unit tests for cached closestCenter collision (docs/jobs-redesign.md §6.2).
 */
import { closestCenter, type CollisionDetection } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';

import {
  boardCollisionCacheGeneration,
  boardCollisionDetection,
  invalidateBoardCollisionCache,
} from './board-collision';

type CollisionArgs = Parameters<CollisionDetection>[0];
type DroppableContainer = CollisionArgs['droppableContainers'][number];
type RawRect = { top: number; left: number; width: number; height: number };

function rect(r: RawRect) {
  return { ...r, bottom: r.top + r.height, right: r.left + r.width };
}

function container(id: string, r: RawRect): DroppableContainer {
  return {
    id,
    key: id,
    disabled: false,
    node: { current: null },
    data: { current: {} },
    rect: { current: rect(r) },
  };
}

function makeArgs(options: {
  containers: DroppableContainer[];
  collisionRect: RawRect;
  pointerCoordinates: { x: number; y: number } | null;
  droppableRects?: Map<string, ReturnType<typeof rect>>;
}): CollisionArgs {
  const collisionRect = rect(options.collisionRect);
  const droppableRects =
    options.droppableRects ?? new Map(options.containers.map((c) => [c.id, c.rect.current!]));
  return {
    active: {
      id: 'active-card',
      data: { current: {} },
      rect: { current: { initial: collisionRect, translated: collisionRect } },
    },
    collisionRect,
    droppableRects,
    droppableContainers: options.containers,
    pointerCoordinates: options.pointerCoordinates,
  };
}

describe('boardCollisionDetection', () => {
  it('matches closestCenter using the snapshotted rect map', () => {
    invalidateBoardCollisionCache();
    const columnA = container('saved', { top: 0, left: 0, width: 200, height: 600 });
    const columnB = container('applied', { top: 0, left: 200, width: 200, height: 600 });
    const args = makeArgs({
      containers: [columnA, columnB],
      collisionRect: { top: 280, left: 140, width: 140, height: 40 },
      pointerCoordinates: { x: 190, y: 300 },
    });

    expect(boardCollisionDetection(args)).toEqual(closestCenter(args));
    expect(boardCollisionDetection(args)[0]?.id).toBe('applied');
  });

  it('ignores later droppableRects mutations until invalidated', () => {
    invalidateBoardCollisionCache();
    const columnA = container('saved', { top: 0, left: 0, width: 200, height: 600 });
    const columnB = container('applied', { top: 0, left: 200, width: 200, height: 600 });
    const first = makeArgs({
      containers: [columnA, columnB],
      collisionRect: { top: 100, left: 20, width: 140, height: 40 },
      pointerCoordinates: { x: 90, y: 120 },
    });
    expect(boardCollisionDetection(first)[0]?.id).toBe('saved');

    // Move B under the collision center without changing map size — cache stays.
    const movedB = container('applied', { top: 0, left: 0, width: 200, height: 600 });
    const second = makeArgs({
      containers: [columnA, movedB],
      collisionRect: { top: 100, left: 20, width: 140, height: 40 },
      pointerCoordinates: { x: 90, y: 120 },
      droppableRects: new Map([
        ['saved', rect({ top: 0, left: 0, width: 200, height: 600 })],
        ['applied', rect({ top: 0, left: 0, width: 200, height: 600 })],
      ]),
    });
    // Same size → still uses first snapshot → still saved (first map).
    expect(boardCollisionDetection(second)[0]?.id).toBe('saved');

    const before = boardCollisionCacheGeneration();
    invalidateBoardCollisionCache();
    expect(boardCollisionCacheGeneration()).toBe(before + 1);
    expect(boardCollisionDetection(second)[0]?.id).toBeDefined();
  });

  it('works for keyboard drags (null pointer) via closestCenter', () => {
    invalidateBoardCollisionCache();
    const columnA = container('saved', { top: 0, left: 0, width: 200, height: 600 });
    const columnB = container('applied', { top: 0, left: 200, width: 200, height: 600 });
    const args = makeArgs({
      containers: [columnA, columnB],
      collisionRect: { top: 280, left: 20, width: 140, height: 40 },
      pointerCoordinates: null,
    });

    expect(boardCollisionDetection(args)).toEqual(closestCenter(args));
  });
});
