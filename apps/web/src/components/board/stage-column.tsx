'use client';

/**
 * @module components/board/stage-column
 *
 * One kanban column: stage header badge + count, droppable body, virtualized
 * past 50 cards (stage-board spec).
 */
import { useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

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
}: StageColumnProps) {
  const t = useTranslations('board');
  const tStages = useTranslations('stages');
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = jobs.length > 50;

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_STRIDE,
    overscan: 8,
    enabled: shouldVirtualize && !collapsed,
  });

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
            {collapsed ? t('expandColumn') : t('collapseColumn')}
            <span className="sr-only">{tStages(stage)}</span>
          </button>
        )}
      </header>

      {!collapsed && (
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
                    <StageCard job={job} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {jobs.map((job) => (
                <StageCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
