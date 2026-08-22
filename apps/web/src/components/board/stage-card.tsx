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
import { memo } from 'react';

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
 * Compute whole days since an ISO timestamp.
 *
 * @param isoDate - ISO timestamp.
 * @returns Whole days elapsed.
 */
export function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

/** Days in stage beyond which a card reads as stale (warning tint). */
export const STALE_DAYS_THRESHOLD = 14;

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
function StageCardInner({ job, dragging = false, onDeleteJob }: StageCardProps) {
  const t = useTranslations('board');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    disabled: dragging,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const days = daysSince(job.currentReactionAt ?? job.firstSeenAt);
  let faviconUrl: string | null = null;
  try {
    faviconUrl = `${new URL(job.url).origin}/favicon.ico`;
  } catch {
    // The source slug remains the fallback for malformed legacy URLs.
  }

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
      <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] text-text-muted">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {faviconUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary source domains cannot be allowlisted.
            <img
              src={faviconUrl}
              alt=""
              className="size-3 shrink-0 rounded-sm"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
          <span className="truncate">{job.sourceSlug}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn('tabular-nums', days > STALE_DAYS_THRESHOLD && 'text-warning')}
            title={t('daysInStageHint')}
          >
            {t('daysInStage', { count: days })}
          </span>
          {onDeleteJob && !dragging && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
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

/** Memoized — a board re-render (drag start, live-region update) must not re-render every mounted card. */
export const StageCard = memo(StageCardInner);
