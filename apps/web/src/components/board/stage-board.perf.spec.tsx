/**
 * @module components/board/stage-board.perf
 *
 * Render-count harness for StageCard memoization. Verified via a stub on
 * `ScoreMeter`, a leaf rendered once per `StageCard` render.
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

vi.mock('@/components/jobs/score-meter', () => ({
  ScoreMeter: () => {
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
 * Minimal dnd-kit wrapper around a single `StageCard`.
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
