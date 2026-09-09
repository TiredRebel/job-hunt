'use client';

/**
 * @module components/jobs/job-card
 *
 * Mobile job card with swipe gestures (docs/jobs-redesign.md §5 / §8).
 */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import { ScoreMeter } from '@/components/jobs/score-meter';
import { StageBadge } from '@/components/stage-badge';
import type { JobRow } from '@/components/jobs/job-table-columns';
import { cn } from '@/lib/utils';

/** Props for {@link JobCard}. */
export interface JobCardProps {
  readonly job: JobRow;
  readonly selected?: boolean;
  readonly focused?: boolean;
  readonly onOpen: () => void;
  readonly onSave: () => void;
  readonly onReject: () => void;
}

const SWIPE_THRESHOLD = 80;

/**
 * Stacked mobile card for a job row.
 *
 * @param props - Card props.
 * @returns The card element.
 */
export function JobCard({ job, selected, focused, onOpen, onSave, onReject }: JobCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    setOffset(event.clientX - startX.current);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (offset > SWIPE_THRESHOLD) {
      onSave();
    } else if (offset < -SWIPE_THRESHOLD) {
      onReject();
    }
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
      <div
        className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-[var(--state-saved-muted)] text-[var(--state-saved-fg)]"
        aria-hidden="true"
      >
        Save
      </div>
      <div
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-[var(--state-rejected-muted)] text-[var(--state-rejected-fg)]"
        aria-hidden="true"
      >
        Reject
      </div>
      <article
        data-job-id={job.id}
        onClick={onOpen}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translate3d(${offset}px,0,0)` }}
        className={cn(
          'relative cursor-pointer border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-3 shadow-[var(--elevation-1)] rounded-[var(--radius-lg)]',
          selected && 'jh-row-selected',
          focused && 'jh-row-focused',
        )}
      >
        <h3 className="truncate text-sm font-medium text-[var(--text-primary)]">{job.title}</h3>
        <p className="truncate text-xs text-[var(--text-secondary)]">
          {[job.company, job.sourceSlug].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ScoreMeter score={job.matchScore} />
          {job.remote === 'remote' && (
            <span className="text-xs text-[var(--text-secondary)]">remote</span>
          )}
          <StageBadge stage={job.currentReaction} />
        </div>
      </article>
    </div>
  );
}
