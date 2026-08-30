'use client';

/**
 * @module components/jobs/jobs-page-header
 *
 * Sticky jobs header with expanded / condensed states driven by scroll
 * (docs/jobs-redesign.md §1.2).
 */
import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** Props for {@link JobsPageHeader}. */
export interface JobsPageHeaderProps {
  readonly total: number;
  readonly unreviewed: number;
  readonly scrollParentRef: RefObject<HTMLElement | null>;
  readonly trailing?: ReactNode;
}

/**
 * Sticky expanded/condensed jobs title bar.
 *
 * @param props - Header props.
 * @returns The sticky header.
 */
export function JobsPageHeader({
  total,
  unreviewed,
  scrollParentRef,
  trailing,
}: JobsPageHeaderProps) {
  const t = useTranslations('jobs');
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const el = scrollParentRef.current;
    if (!el) {
      return;
    }
    const onScroll = (): void => {
      setCondensed(el.scrollTop > 8);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollParentRef]);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface)] px-1 transition-[height] duration-[var(--motion-fast)] ease-out',
        condensed ? 'h-11' : 'h-16',
      )}
    >
      <div className="min-w-0 flex-1">
        {condensed ? (
          <h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {t('header.condensed', { unreviewed })}
          </h2>
        ) : (
          <>
            <h2 className="truncate text-lg font-semibold text-[var(--text-primary)]">
              {t('title')}
            </h2>
            <p className="tabular-nums truncate text-xs text-[var(--text-secondary)]">
              {t('header.subline', { total, unreviewed })}
            </p>
          </>
        )}
      </div>
      {unreviewed > 0 && (
        <span className="rounded-[var(--radius-pill)] bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
          {t('queue.left', { count: unreviewed })}
        </span>
      )}
      {trailing}
    </header>
  );
}
