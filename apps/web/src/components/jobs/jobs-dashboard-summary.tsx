'use client';

/**
 * @module components/jobs/jobs-dashboard-summary
 *
 * Jobs-dashboard header panel: triage headline plus four at-a-glance metrics
 * (total, high-fit, in-motion, unreviewed) computed from the loaded rows,
 * followed by a reconciliation strip explaining how `total` relates to the
 * broader scraper-discovered count (raw / processing / failed / hidden).
 */
import { ArrowUpRight, ScanSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { queryKeys } from '@/lib/api/query-keys';
import { getJobsReconciliation } from '@/lib/api/reconciliation';

import type { JobRow } from './job-table-columns';

interface JobsDashboardSummaryProps {
  readonly rows: readonly JobRow[];
  readonly total: number;
}

/** Compact opportunity overview that anchors the jobs triage workspace. */
export function JobsDashboardSummary({ rows, total }: JobsDashboardSummaryProps) {
  const t = useTranslations('jobs.dashboard');
  const highFit = rows.filter((job) => (job.matchScore ?? 0) >= 80).length;
  const active = rows.filter((job) =>
    ['applied', 'interview', 'offer'].includes(job.currentReaction ?? ''),
  ).length;
  const unreviewed = rows.filter((job) => !job.currentReaction).length;
  const metrics = [
    { label: t('total'), value: total },
    { label: t('highFit'), value: highFit },
    { label: t('active'), value: active },
    { label: t('unreviewed'), value: unreviewed },
  ];

  // Reconciliation strip degrades gracefully — a failed fetch just means the
  // strip is omitted. The query is independent from the jobs list query so
  // filter refetches don't refetch reconciliation.
  const reconciliationQuery = useQuery({
    queryKey: queryKeys.reconciliation.jobs,
    queryFn: ({ signal }) => getJobsReconciliation(signal),
  });
  const reconciliation = reconciliationQuery.data;
  const showStrip = reconciliation !== undefined && reconciliation.rawTotal > 0;

  return (
    <section className="workspace-panel overflow-hidden" aria-labelledby="opportunity-radar-title">
      <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-start sm:justify-between lg:px-6">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent-soft text-accent">
            <ScanSearch aria-hidden="true" size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="utility-label text-accent">{t('eyebrow')}</span>
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            </div>
            <h2
              id="opportunity-radar-title"
              className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-text-primary"
            >
              {t('title')}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-text-muted">{t('description')}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 bg-background">
          <Link href="/board">
            {t('viewBoard')}
            <ArrowUpRight aria-hidden="true" size={14} />
          </Link>
        </Button>
      </div>

      <div className="relative grid grid-cols-2 border-t border-border bg-surface-elevated/55 sm:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className="relative px-5 py-3.5 sm:px-6 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-border"
          >
            <span className="tabular-nums block text-xl font-semibold tracking-[-0.04em] text-text-primary">
              {metric.value}
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">{metric.label}</span>
            <span
              className="absolute inset-x-0 bottom-0 h-0.5 bg-accent transition-transform"
              style={{
                transform: `scaleX(${index === 0 && total > 0 ? 1 : Math.min(1, metric.value / Math.max(1, total))})`,
                transformOrigin: 'left',
              }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      {showStrip && reconciliation && (
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border bg-surface-elevated/30 px-5 py-2 text-xs text-text-muted sm:px-6"
          data-testid="jobs-reconciliation-strip"
        >
          <span className="tabular-nums font-mono">
            {t('reconciliation.discovered')}: {reconciliation.rawTotal}
          </span>
          <span className="tabular-nums font-mono">
            {t('reconciliation.processing')}: {reconciliation.pending}
          </span>
          {reconciliation.failed > 0 ? (
            <Link
              href="/jobs/dead-letter"
              className="tabular-nums font-mono text-warning underline-offset-2 hover:underline"
            >
              {t('reconciliation.failed')}: {reconciliation.failed}
            </Link>
          ) : (
            <span className="tabular-nums font-mono">
              {t('reconciliation.failed')}: {reconciliation.failed}
            </span>
          )}
          <span className="tabular-nums font-mono">
            {t('reconciliation.hidden')}: {reconciliation.hiddenJobs}
          </span>
        </div>
      )}
    </section>
  );
}
