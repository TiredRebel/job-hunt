'use client';

/**
 * @module components/jobs/saved-view-tabs
 *
 * System + user saved views (docs/jobs-redesign.md §4.3).
 */
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** Built-in views shipped with the product. */
export const SYSTEM_VIEWS = ['unreviewed', 'highFit', 'inMotion', 'rejected', 'hidden'] as const;

export type SystemViewId = (typeof SYSTEM_VIEWS)[number];

/** Props for {@link SavedViewTabs}. */
export interface SavedViewTabsProps {
  readonly activeView: string;
  readonly counts?: Partial<Record<SystemViewId, number>>;
  readonly onSelect: (view: string) => void;
  readonly onCreate?: () => void;
}

/**
 * Tabs above the jobs list for saved views.
 *
 * @param props - Tab props.
 * @returns The tab strip.
 */
export function SavedViewTabs({ activeView, counts, onSelect, onCreate }: SavedViewTabsProps) {
  const t = useTranslations('jobs.views');

  return (
    <div
      role="tablist"
      aria-label={t('label')}
      className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border-subtle)] pb-px"
    >
      {SYSTEM_VIEWS.map((view) => {
        const selected = activeView === view;
        const count = counts?.[view];
        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(view)}
            className={cn(
              'shrink-0 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm',
              selected
                ? 'bg-[var(--accent-muted)] font-medium text-[var(--accent)] shadow-[inset_0_-2px_0_var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {t(view)}
            {typeof count === 'number' && (
              <span className="tabular-nums ml-1.5 text-xs opacity-80">{count}</span>
            )}
          </button>
        );
      })}
      {onCreate && (
        <button
          type="button"
          aria-label={t('create')}
          onClick={onCreate}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Plus aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  );
}
