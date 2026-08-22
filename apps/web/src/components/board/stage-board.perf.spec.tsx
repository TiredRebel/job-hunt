/**
 * @module components/board/stage-board.perf
 *
 * Render-count harness for the render-memoization group (design.md D2/D3 in
 * openspec/changes/improve-board-dnd-perf).
 *
 * Scoped to `StageCard` in isolation, not the full `StageBoard` tree: dnd-kit
 * shares one board-wide `droppableRects`/registry context across every
 * column's `SortableContext`, so mounting or unmounting *any* droppable
 * (e.g. expanding/collapsing the Rejected column) invalidates that shared
 * context and forces every mounted card to re-render via context
 * propagation — `React.memo` cannot block a context-driven re-render, only a
 * prop-driven one. That's an architectural property of dnd-kit itself, not
 * something this change's memoization touches. What D2 *does* guarantee —
 * and what's verified here — is that a `StageCard` with referentially-stable
 * props does not re-render when an unrelated ancestor re-renders (the actual
 * mechanism `memo(StageCardInner)` adds). Verified via a stub on
 * `ScoreBadge`, a leaf rendered once per `StageCard` render, so its call
 * count is a direct proxy for card render count without touching production
 * code.
 */
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Job } from '@/lib/api/jobs';

import { StageCard } from './stage-card';

const probe = { renders: 0 };

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock('@/components/score-badge', () => ({
  ScoreBadge: () => {
    probe.renders += 1;
    return null;
  },
}));

const STABLE_JOB: Job = {
  id: 'job-1',
  sourceId: 1,
  sourceSlug: 'dou',
  externalId: 'ext-1',
  url: 'https://example.com/1',
  title: 'Backend Engineer',
  company: 'Acme',
  descriptionMd: null,
  summary: null,
  tags: [],
  redFlags: [],
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  seniority: 'unknown',
  remote: 'unknown',
  location: null,
  postedAt: null,
  firstSeenAt: '2026-07-01T00:00:00Z',
  lastSeenAt: '2026-07-02T00:00:00Z',
  status: 'new',
  matchScore: 70,
  currentReaction: 'saved',
  currentReactionAt: null,
} as Job;

const STABLE_ON_DELETE = () => {};
const STABLE_ITEMS = [STABLE_JOB.id];

/**
 * Minimal dnd-kit wrapper around a single `StageCard`, with its own
 * unrelated `tick` state so a re-render can be forced without touching any
 * dnd-kit droppable/draggable registration.
 *
 * @returns The harness element.
 */
function MemoHarness() {
  const [tick, setTick] = useState(0);
  return (
    <DndContext>
      <SortableContext items={STABLE_ITEMS}>
        <button type="button" onClick={() => setTick((value) => value + 1)}>
          tick-{tick}
        </button>
        <StageCard job={STABLE_JOB} onDeleteJob={STABLE_ON_DELETE} />
      </SortableContext>
    </DndContext>
  );
}

describe('StageCard render cost', () => {
  it('does not re-render when an unrelated ancestor re-renders', async () => {
    render(<MemoHarness />);
    await waitFor(() => expect(probe.renders).toBe(1));

    probe.renders = 0;
    fireEvent.click(screen.getByText(/tick-/));

    expect(probe.renders).toBe(0);
  });
});
