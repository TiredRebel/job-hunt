'use client';

/**
 * @module components/board/stage-card
 *
 * Compact kanban card (≤64px) showing title, company, score, source, and
 * days-in-stage (stage-board spec).
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ScoreBadge } from '@/components/score-badge';
import { Button } from '@/components/ui/button';
import type { Job } from '@/lib/api/jobs';
import { cn } from '@/lib/utils';

/** Props accepted by {@link StageCard}. */
export interface StageCardProps {
  readonly job: Job;
  readonly dragging?: boolean;
  readonly onDeleteJob?: ((job: Job) => void) | undefined;
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
 * sortable — `useSortable` (not plain `useDraggable`) so the card
 * participates in its column's `SortableContext` for within-column
 * reordering, while remaining a normal cross-column draggable/droppable
 * (design.md D8 in openspec/changes/notification-settings-and-board-reorder).
 *
 * @param props - Card props.
 * @returns The card element.
 */
export function StageCard({ job, dragging = false, onDeleteJob }: StageCardProps) {
  const t = useTranslations('board');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: dragging,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
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
        <div className="flex items-center gap-1">
          <span className="tabular-nums" title={t('daysInStageHint')}>
            {t('daysInStage', { count: days })}
          </span>
          {onDeleteJob && !dragging && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 gap-1 px-1 text-[11px] text-text-muted hover:text-destructive"
              aria-label={t('deleteAction', { title: job.title })}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteJob(job);
              }}
            >
              <Trash2 aria-hidden="true" size={13} />
              <span>{t('delete')}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
