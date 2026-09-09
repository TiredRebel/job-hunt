'use client';

/**
 * @module components/jobs/jobs-pagination
 *
 * Page-size selector + Previous/Next navigation + result-range readout for
 * the `/jobs` table (jobs-dashboard spec "Jobs list pagination controls").
 * Mirrors `FilterBar`'s URL-write pattern: `params` is the single source of
 * truth, writing `limit`/`offset` happens via `router.replace`, so paging
 * state is shareable and survives reload exactly like filters and sort do.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, usePathname } from '@/i18n/navigation';
import type { JobsListParams } from '@/lib/api/jobs';
import { DEFAULT_JOBS_LIMIT, jobsListParamsToSearchParams } from '@/lib/jobs/search-params';

/** Page-size options offered by the selector — the API's `Max(100)` allows exactly these. */
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

/** Props accepted by {@link JobsPagination}. */
export interface JobsPaginationProps {
  readonly params: JobsListParams;
  readonly total: number;
}

/**
 * URL-driven pagination bar: page-size select, Previous/Next, range readout.
 *
 * @param props - Pagination props.
 * @returns The pagination bar, or `null` when there are no results.
 */
export function JobsPagination({ params, total }: JobsPaginationProps) {
  const t = useTranslations('jobs.pagination');
  const router = useRouter();
  const pathname = usePathname();
  const rawSearchParams = useSearchParams();

  if (total === 0) {
    return null;
  }

  const limit = params.limit ?? DEFAULT_JOBS_LIMIT;
  const offset = params.offset ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const from = offset + 1;
  const to = Math.min(offset + limit, total);
  const canGoPrevious = offset > 0;
  const canGoNext = offset + limit < total;

  const applyPatch = (patch: Partial<JobsListParams>): void => {
    const next: JobsListParams = { ...params, ...patch };
    const nextSearchParams = jobsListParamsToSearchParams(next);
    const preservedJob = rawSearchParams.get('job');
    if (preservedJob) {
      nextSearchParams.set('job', preservedJob);
    }
    const query = nextSearchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-elevated/45 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>{t('perPage')}</span>
        <Select
          value={String(limit)}
          onValueChange={(value) => applyPatch({ limit: Number(value), offset: 0 })}
        >
          <SelectTrigger className="h-8 w-20" aria-label={t('pageSize')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="tabular-nums font-mono">{t('range', { from, to, total })}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={!canGoPrevious}
            onClick={() => applyPatch({ offset: Math.max(0, offset - limit) })}
            aria-label={t('previous')}
          >
            <ChevronLeft aria-hidden="true" size={14} />
          </Button>
          <span className="tabular-nums px-1">
            {t('page', { page: currentPage, count: pageCount })}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={!canGoNext}
            onClick={() => applyPatch({ offset: offset + limit })}
            aria-label={t('next')}
          >
            <ChevronRight aria-hidden="true" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
