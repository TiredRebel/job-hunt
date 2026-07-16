'use client';

/**
 * @module components/board/stage-card
 *
 * Compact kanban card (≤64px) showing title, company, score, source, and
 * days-in-stage (stage-board spec).
 */
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';

import { ScoreBadge } from '@/components/score-badge';
import type { Job } from '@/lib/api/jobs';
import { cn } from '@/lib/utils';

/** Props accepted by {@link StageCard}. */
export interface StageCardProps {
  readonly job: Job;
  readonly dragging?: boolean;
}

/**
 * Compute whole days since `firstSeenAt` (proxy for days-in-stage when
 * reaction-timestamp is not on the list payload).
 *
 * @param isoDate - ISO timestamp.
 * @returns Whole days elapsed.
 */
function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

/**
 * Compact board card. When not in the drag overlay, registers as a dnd-kit
 * draggable.
 *
 * @param props - Card props.
 * @returns The card element.
 */
export function StageCard({ job, dragging = false }: StageCardProps) {
  const t = useTranslations('board');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    disabled: dragging,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const days = daysSince(job.firstSeenAt);

  return (
    <article
      ref={dragging ? undefined : setNodeRef}
      style={style}
      {...(dragging ? {} : { ...listeners, ...attributes })}
      className={cn(
        'flex h-16 cursor-grab flex-col justify-between rounded-[var(--radius-control)] border border-border bg-surface px-2.5 py-1.5 active:cursor-grabbing',
        (isDragging || dragging) && 'opacity-80 shadow-[var(--shadow-elevated)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-text-primary">{job.title}</p>
          <p className="truncate text-[11px] text-text-muted">{job.company ?? '—'}</p>
        </div>
        <ScoreBadge score={job.matchScore} className="shrink-0" />
      </div>
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span>{job.sourceSlug}</span>
        <span className="tabular-nums" title={t('daysInStageHint')}>
          {t('daysInStage', { count: days })}
        </span>
      </div>
    </article>
  );
}
