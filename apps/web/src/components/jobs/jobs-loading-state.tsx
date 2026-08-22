'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

/** Layout-accurate loading state for the Jobs dashboard. */
export function JobsLoadingState() {
  const t = useTranslations('jobs');
  return (
    <div className="flex h-full flex-col gap-6" role="status" aria-label={t('loading')}>
      <span className="sr-only">{t('loading')}</span>
      <div className="workspace-panel overflow-hidden" aria-hidden="true">
        <div className="px-4 py-3">
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="grid grid-cols-4 gap-px bg-border">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="bg-surface p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-7 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div
        className="workspace-panel flex flex-wrap items-center gap-2 px-4 py-3"
        aria-hidden="true"
      >
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
      <div className="workspace-panel flex-1 overflow-hidden" aria-hidden="true">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-3 w-40" />
        </div>
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="flex h-9 items-center gap-4 border-b border-border px-3">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
