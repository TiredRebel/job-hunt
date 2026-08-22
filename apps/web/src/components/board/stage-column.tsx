'use client';

/**
 * @module components/board/stage-column
 *
 * One kanban column: stage header badge + count, droppable body, virtualized
 * past 50 cards (stage-board spec).
 */
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslations } from 'next-intl';
import { useMemo, useRef } from 'react';

import { StageCard } from '@/components/board/stage-card';
import { StageBadge } from '@/components/stage-badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Job } from '@/lib/api/jobs';
import { cn } from '@/lib/utils';

/** Card height + gap used by the column virtualizer. */
const CARD_STRIDE = 68;

/** Board column stage ids. */
type BoardStage = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

/** Props accepted by {@link StageColumn}. */
export interface StageColumnProps {
  readonly stage: BoardStage;
  readonly jobs: readonly Job[];
  readonly collapsed: boolean;
  readonly loading: boolean;
  readonly onToggleCollapsed?: (() => void) | undefined;
  readonly onDeleteJob: (job: Job) => void;
}

/**
 * Droppable stage column with optional collapse and virtualization.
 *
 * @param props - Column props.
 * @returns The column element.
 */
export function StageColumn({
  stage,
  jobs,
  collapsed,
  loading,
  onToggleCollapsed,
  onDeleteJob,
}: StageColumnProps) {
  const t = useTranslations('board');
  const tStages = useTranslations('stages');
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = jobs.length > 50;
  const itemIds = useMemo(() => jobs.map((job) => job.id), [jobs]);

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_STRIDE,
    overscan: 8,
    enabled: shouldVirtualize && !collapsed,
  });

  // Collapsed columns (Rejected, by default) shrink to a narrow rail instead
  // of keeping the full column width with an empty body — the point of
  // collapsing is to give the space back to the active stages.
  if (collapsed) {
    return (
      <section
        ref={setNodeRef}
        className={cn(
          'flex w-11 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface py-3',
          isOver && 'border-accent',
        )}
      >
        <StageBadge stage={stage} className="pointer-events-none" />
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="text-text-muted hover:text-text-primary [writing-mode:vertical-rl]"
            aria-expanded={false}
            aria-label={`${tStages(stage)} · ${t('expandColumn')}`}
          >
            <span className="utility-label" aria-hidden="true">
              {tStages(stage)}
            </span>
          </button>
        )}
        <span className="tabular-nums text-xs text-text-muted">{jobs.length}</span>
      </section>
    );
  }

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex w-64 shrink-0 flex-col rounded-[var(--radius-card)] border border-border bg-surface',
        isOver && 'border-accent',
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <StageBadge stage={stage} />
          <span className="tabular-nums text-xs text-text-muted">{jobs.length}</span>
        </div>
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="text-xs text-text-muted hover:text-text-primary"
            aria-expanded={!collapsed}
          >
            {t('collapseColumn')}
            <span className="sr-only">{tStages(stage)}</span>
          </button>
        )}
      </header>

      {!collapsed && (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div ref={scrollRef} className="min-h-24 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-text-muted">{t('emptyColumn')}</p>
            ) : shouldVirtualize ? (
              <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const job = jobs[virtualRow.index];
                  if (!job) {
                    return null;
                  }
                  return (
                    <div
                      key={job.id}
                      className="absolute left-0 right-0 px-0"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <StageCard job={job} onDeleteJob={onDeleteJob} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {jobs.map((job) => (
                  <StageCard key={job.id} job={job} onDeleteJob={onDeleteJob} />
                ))}
              </div>
            )}
          </div>
        </SortableContext>
      )}
    </section>
  );
}
