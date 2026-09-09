'use client';

/**
 * @module components/jobs/jobs-context-column
 *
 * Collapsible context column: saved views + triage progress
 * (docs/jobs-redesign.md §1.1). Visible ≥1440; toggleable 1024–1439;
 * drawer below 1024.
 */
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { SavedViewTabs, type SystemViewId } from '@/components/jobs/saved-view-tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLLAPSE_KEY = 'job-hunter-context-collapsed';

/** Props for {@link JobsContextColumn}. */
export interface JobsContextColumnProps {
  readonly activeView: string;
  readonly counts?: Partial<Record<SystemViewId, number>>;
  readonly unreviewed: number;
  readonly total: number;
  readonly onSelectView: (view: string) => void;
  readonly onCreateView?: () => void;
}

/**
 * Context column for the jobs work surface.
 *
 * @param props - Column props.
 * @returns The context column / drawer.
 */
export function JobsContextColumn({
  activeView,
  counts,
  unreviewed,
  total,
  onSelectView,
  onCreateView,
}: JobsContextColumnProps) {
  const t = useTranslations('jobs');
  const [collapsed, setCollapsed] = useState(() => {
    // This component is `use client`, but it can still be pre-rendered on the
    // server during SSR, so guard against missing `window`.
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapsed = (): void => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const progress = total === 0 ? 0 : Math.min(100, ((total - unreviewed) / total) * 100);

  const body = (
    <div className="flex h-full flex-col gap-4 p-3">
      <div>
        <p className="utility-label text-[var(--text-secondary)]">{t('context.views')}</p>
        <div className="mt-2">
          <SavedViewTabs
            activeView={activeView}
            {...(counts ? { counts } : {})}
            onSelect={(view) => {
              onSelectView(view);
              setDrawerOpen(false);
            }}
            {...(onCreateView ? { onCreate: onCreateView } : {})}
          />
        </div>
      </div>
      <div>
        <p className="utility-label text-[var(--text-secondary)]">{t('context.progress')}</p>
        <p className="tabular-nums mt-2 text-sm text-[var(--text-primary)]">
          {t('context.reviewed', { reviewed: Math.max(0, total - unreviewed), total })}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-sunken)]">
          <div
            className="h-full bg-[var(--accent)]"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="tabular-nums mt-1 text-xs text-[var(--text-secondary)]">
          {t('queue.left', { count: unreviewed })}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / large tablet column */}
      <aside
        className={cn(
          'relative hidden shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface)]',
          'min-[1024px]:block',
          collapsed ? 'w-10' : 'w-[280px]',
          'max-[1439px]:w-10 max-[1439px]:[&_.context-body]:hidden',
          !collapsed && 'min-[1440px]:w-[280px]',
        )}
        aria-label={t('context.label')}
      >
        <div className="flex items-center justify-end border-b border-[var(--border-subtle)] p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden min-[1440px]:inline-flex"
            aria-label={collapsed ? t('context.expand') : t('context.collapse')}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" size={16} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={16} />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-[1440px]:hidden"
            aria-label={t('context.openDrawer')}
            onClick={() => setDrawerOpen(true)}
          >
            <PanelLeftOpen aria-hidden="true" size={16} />
          </Button>
        </div>
        {!collapsed && <div className="context-body hidden min-[1440px]:block">{body}</div>}
      </aside>

      {/* Drawer for <1024 and icon-rail toggle at 1024–1439 */}
      {drawerOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[var(--text-primary)]/30 min-[1440px]:hidden"
            aria-label={t('context.closeDrawer')}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t('context.label')}
            className="fixed inset-y-0 left-0 z-50 w-[min(100%,280px)] border-r border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--elevation-2)] min-[1440px]:hidden"
          >
            <div className="flex justify-end p-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                {t('context.closeDrawer')}
              </Button>
            </div>
            {body}
          </aside>
        </>
      )}
    </>
  );
}
