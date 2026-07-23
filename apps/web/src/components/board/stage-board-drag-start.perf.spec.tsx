/**
 * @module components/board/stage-board-drag-start.perf
 *
 * Bounded-regression guard for lifting a card on the real `StageBoard`
 * (which sets `activeJob`/`liveMessage`, re-rendering `StageBoard`): other
 * columns' cards DO re-render — dnd-kit's `DndContext` broadcasts drag state
 * to every mounted card via React Context, which `React.memo` cannot block
 * (see the `describe` block's comment and design.md's D2 addendum in
 * openspec/changes/improve-board-dnd-perf) — so this asserts the count stays
 * small and bounded rather than asserting zero. Unlike the column-collapse
 * trigger tried in `stage-board.perf.spec.tsx` (rejected — collapsing
 * unmounts a `SortableContext`, a different and larger-magnitude re-render
 * source), drag-start mounts/unmounts nothing, isolating the Context-
 * propagation cost specifically.
 *
 * Lift is triggered via the `KeyboardSensor` (`Space` on a card's activator
 * node) rather than `PointerSensor`: dnd-kit's keyboard activation fires
 * `onStart` synchronously with `defaultCoordinates`, with no dependency on
 * `getBoundingClientRect` measurements (which jsdom reports as all-zero) —
 * unlike a pointer drag, which needs real rects to clear its activation
 * distance constraint.
 */
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Job } from '@/lib/api/jobs';

import { StageBoard } from './stage-board';

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock('@/lib/hooks/use-active-profile', () => ({
  useActiveProfile: () => ({ data: { id: 1 } }),
}));

/** Renders once per `StageCard` — keyed by `score` so per-card render counts are distinguishable. */
const renderCountsByScore: Record<number, number> = {};

vi.mock('@/components/score-badge', () => ({
  ScoreBadge: ({ score }: { score: number | null }) => {
    if (typeof score === 'number') {
      renderCountsByScore[score] = (renderCountsByScore[score] ?? 0) + 1;
    }
    return null;
  },
}));

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: overrides.id as string,
    sourceId: 1,
    sourceSlug: 'dou',
    externalId: `ext-${overrides.id as string}`,
    url: `https://example.com/${overrides.id as string}`,
    title: overrides.title as string,
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
    currentReaction: overrides.currentReaction,
    matchScore: overrides.matchScore as number,
  } as Job;
}

const SAVED_JOB = makeJob({
  id: 'saved-1',
  title: 'Saved Job',
  currentReaction: 'saved',
  matchScore: 11,
});
const APPLIED_JOB = makeJob({
  id: 'applied-1',
  title: 'Applied Job',
  currentReaction: 'applied',
  matchScore: 22,
});
const INTERVIEW_JOB = makeJob({
  id: 'interview-1',
  title: 'Interview Job',
  currentReaction: 'interview',
  matchScore: 33,
});
const ALL_JOBS = [SAVED_JOB, APPLIED_JOB, INTERVIEW_JOB];

vi.mock('@/lib/api/jobs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/jobs')>();
  return {
    ...actual,
    deleteJob: vi.fn(),
    listJobs: vi.fn((params: { reaction?: readonly string[] }) => {
      const stage = params.reaction?.[0];
      const items = ALL_JOBS.filter((job) => job.currentReaction === stage);
      return Promise.resolve({ items, total: items.length });
    }),
  };
});

function renderBoard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StageBoard />
    </QueryClientProvider>,
  );
}

// Regression guard, not a zero-count assertion — dnd-kit's DndContext
// provides one InternalContext (containing `active`/`over`/etc.) to its
// ENTIRE children tree; useSortable/useDroppable (used by every StageCard,
// in every column) consume it via useContext. A drag-start changes `active`,
// which changes that one shared context value, which forces every consumer
// to re-render — React Context propagation bypasses React.memo
// unconditionally; memo only blocks parent-prop-driven re-renders. Verified
// against @dnd-kit/core's source (core.esm.js ~L3337-3360: the memoized
// `internalContext` object, dependent on `active`, feeds
// `InternalContext.Provider` wrapping `children` — i.e. the whole board).
// Accepted as an architectural ceiling (see design.md's D2 addendum in
// openspec/changes/improve-board-dnd-perf): fixing it needs per-column
// DndContext isolation, which breaks cross-column drag, so it's out of
// scope. What this test asserts instead: other-column re-renders happen
// (>0, proving the floor is real and this test isn't stale) but stay at or
// below a small fixed bound, catching any future change that makes the
// Context-propagation cost worse.
describe('StageBoard drag-start render cost', () => {
  beforeEach(() => {
    for (const key of Object.keys(renderCountsByScore)) {
      delete renderCountsByScore[Number(key)];
    }
  });

  it('bounds re-renders of other-column cards when a card is lifted', async () => {
    renderBoard();

    await screen.findByText('Saved Job');
    await screen.findByText('Applied Job');
    await screen.findByText('Interview Job');
    await waitFor(() => {
      expect(renderCountsByScore[APPLIED_JOB.matchScore!]).toBeGreaterThan(0);
      expect(renderCountsByScore[INTERVIEW_JOB.matchScore!]).toBeGreaterThan(0);
    });

    // Baseline: discard mount-time render counts, keep only what happens after lift.
    for (const key of Object.keys(renderCountsByScore)) {
      delete renderCountsByScore[Number(key)];
    }

    const savedCard = screen.getByText('Saved Job').closest('article');
    if (!savedCard) {
      throw new Error('Saved Job card article not found');
    }
    fireEvent.keyDown(savedCard, { code: 'Space' });

    // Confirms onDragStart actually fired (handleDragStart sets this live-region text) —
    // proof the lift was real, not just a no-op keydown; also flushes the resulting re-render.
    await screen.findByText(/announceLifted/);

    // Architectural floor, not a bug: dnd-kit's shared drag-state Context
    // re-renders every mounted card on lift, bypassing React.memo. This
    // asserts the count is real (>0 — a future dnd-kit upgrade or fix that
    // drives it to 0 should make this fail loudly, not silently pass) and
    // bounded (<=5 — a regression guard against it creeping higher).
    const MAX_OTHER_COLUMN_RERENDERS = 5;
    expect(renderCountsByScore[APPLIED_JOB.matchScore!] ?? 0).toBeGreaterThan(0);
    expect(renderCountsByScore[APPLIED_JOB.matchScore!] ?? 0).toBeLessThanOrEqual(
      MAX_OTHER_COLUMN_RERENDERS,
    );
    expect(renderCountsByScore[INTERVIEW_JOB.matchScore!] ?? 0).toBeGreaterThan(0);
    expect(renderCountsByScore[INTERVIEW_JOB.matchScore!] ?? 0).toBeLessThanOrEqual(
      MAX_OTHER_COLUMN_RERENDERS,
    );
  });
});
