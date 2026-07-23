/**
 * @module components/board/board-collision.spec
 *
 * Unit tests for `boardCollisionDetection` (design.md D3 in
 * openspec/changes/improve-board-dnd-perf) against synthetic droppables —
 * no DOM/dnd-kit context needed since the algorithm only reads rects.
 */
import { closestCenter, type CollisionDetection } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';

import { boardCollisionDetection } from './board-collision';

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
}): CollisionArgs {
  const collisionRect = rect(options.collisionRect);
  return {
    active: {
      id: 'active-card',
      data: { current: {} },
      rect: { current: { initial: collisionRect, translated: collisionRect } },
    },
    collisionRect,
    droppableRects: new Map(options.containers.map((c) => [c.id, c.rect.current!])),
    droppableContainers: options.containers,
    pointerCoordinates: options.pointerCoordinates,
  };
}

describe('boardCollisionDetection', () => {
  it('resolves a boundary drop to the column the pointer is inside, not the column the dragged rect is closer to', () => {
    const columnA = container('saved', { top: 0, left: 0, width: 200, height: 600 });
    const columnB = container('applied', { top: 0, left: 200, width: 200, height: 600 });
    const args = makeArgs({
      containers: [columnA, columnB],
      collisionRect: { top: 280, left: 140, width: 140, height: 40 }, // center x=210, closer to B's center (300) than A's (100)
      pointerCoordinates: { x: 190, y: 300 }, // inside A, near the A/B boundary
    });

    expect(boardCollisionDetection(args)[0]?.id).toBe('saved');
    // Sanity: plain closestCenter picks the other column here — that's the bug this fixes.
    expect(closestCenter(args)[0]?.id).toBe('applied');
  });

  it('resolves a drop on a card to that card, not the enclosing column', () => {
    const column = container('applied', { top: 0, left: 0, width: 200, height: 600 });
    const job1 = container('job-1', { top: 0, left: 10, width: 180, height: 68 });
    const job2 = container('job-2', { top: 76, left: 10, width: 180, height: 68 });
    const job3 = container('job-3', { top: 152, left: 10, width: 180, height: 68 });
    const args = makeArgs({
      containers: [column, job1, job2, job3],
      collisionRect: { top: 76, left: 10, width: 180, height: 68 },
      pointerCoordinates: { x: 100, y: 110 }, // inside job2 and the column
    });

    expect(boardCollisionDetection(args)[0]?.id).toBe('job-2');
  });

  it('resolves a drop on empty column space to the column', () => {
    const column = container('applied', { top: 0, left: 0, width: 200, height: 600 });
    const job1 = container('job-1', { top: 0, left: 10, width: 180, height: 68 });
    const args = makeArgs({
      containers: [column, job1],
      collisionRect: { top: 500, left: 10, width: 180, height: 68 },
      pointerCoordinates: { x: 100, y: 500 }, // below the only card, still inside the column
    });

    expect(boardCollisionDetection(args)[0]?.id).toBe('applied');
  });

  it('falls back to closestCenter for keyboard drags (no pointer coordinates)', () => {
    const columnA = container('saved', { top: 0, left: 0, width: 200, height: 600 });
    const columnB = container('applied', { top: 0, left: 200, width: 200, height: 600 });
    const args = makeArgs({
      containers: [columnA, columnB],
      collisionRect: { top: 280, left: 20, width: 140, height: 40 },
      pointerCoordinates: null,
    });

    expect(boardCollisionDetection(args)).toEqual(closestCenter(args));
  });

  it('falls back to rectIntersection when the pointer is in the gap between droppables', () => {
    const columnA = container('saved', { top: 0, left: 0, width: 200, height: 600 });
    const columnB = container('applied', { top: 0, left: 250, width: 200, height: 600 });
    const args = makeArgs({
      containers: [columnA, columnB],
      collisionRect: { top: 280, left: 150, width: 40, height: 40 }, // overlaps only column A
      pointerCoordinates: { x: 225, y: 300 }, // in the gap, inside neither column
    });

    expect(boardCollisionDetection(args)[0]?.id).toBe('saved');
  });
});
