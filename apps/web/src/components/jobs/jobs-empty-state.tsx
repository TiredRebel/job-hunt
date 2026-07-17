'use client';

/**
 * @module components/jobs/jobs-empty-state
 *
 * The two `/jobs` empty states from UI_DESIGN §5.1: "no jobs yet" (points to
 * Sources) vs "filters match nothing" (offers reset). Icon + one sentence +
 * one action — no illustration clip-art.
 */
import { Inbox, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/** Props accepted by {@link JobsEmptyState}. */
export interface JobsEmptyStateProps {
  readonly variant: 'no-jobs' | 'no-results';
  readonly onReset?: () => void;
}

/**
 * Empty-state placeholder for the jobs table.
 *
 * @param props - Empty state props.
 * @returns The empty state element.
 */
export function JobsEmptyState({ variant, onReset }: JobsEmptyStateProps) {
  const t = useTranslations('jobs');

  if (variant === 'no-jobs') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="relative flex size-16 items-center justify-center rounded-full border border-border bg-surface-elevated text-accent before:absolute before:-inset-3 before:rounded-full before:border before:border-dashed before:border-border">
          <Inbox aria-hidden="true" size={25} />
        </span>
        <div>
          <p className="text-base font-semibold tracking-[-0.02em] text-text-primary">
            {t('empty.noJobsTitle')}
          </p>
          <p className="mt-1.5 max-w-md text-sm text-text-muted">{t('empty.noJobsBody')}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/sources">{t('empty.noJobsAction')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="relative flex size-16 items-center justify-center rounded-full border border-border bg-surface-elevated text-accent before:absolute before:-inset-3 before:rounded-full before:border before:border-dashed before:border-border">
        <SearchX aria-hidden="true" size={25} />
      </span>
      <div>
        <p className="text-base font-semibold tracking-[-0.02em] text-text-primary">
          {t('empty.noResultsTitle')}
        </p>
        <p className="mt-1.5 max-w-md text-sm text-text-muted">{t('empty.noResultsBody')}</p>
      </div>
      <Button size="sm" onClick={onReset}>
        {t('empty.noResultsAction')}
      </Button>
    </div>
  );
}
