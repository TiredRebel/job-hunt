'use client';

/**
 * @module components/jobs/jobs-dashboard-summary
 *
 * Jobs-dashboard header panel: triage headline plus four at-a-glance metrics
 * (total, high-fit, in-motion, unreviewed), followed by a reconciliation strip
 * explaining how `total` relates to the broader scraper-discovered count
 * (raw / processing / failed / hidden).
 *
 * All four metrics come from the list endpoint and share one scope: they count
 * every row matching the active filter, not the loaded page. Deriving three of
 * them from the page while `total` stayed global made the panel contradict
 * itself ("20 unreviewed" beside "189 all roles" read as 169 reviewed).
 */
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { queryKeys } from '@/lib/api/query-keys';
import { getJobsReconciliation } from '@/lib/api/reconciliation';

interface JobsDashboardSummaryProps {
  readonly total: number;
  readonly highFit: number;
  readonly inMotion: number;
  readonly unreviewed: number;
}

/** Compact opportunity overview that anchors the jobs triage workspace. */
export function JobsDashboardSummary({
  total,
  highFit,
  inMotion,
  unreviewed,
}: JobsDashboardSummaryProps) {
  const t = useTranslations('jobs.dashboard');
  const metrics = [
    { label: t('total'), value: total },
    { label: t('highFit'), value: highFit },
    { label: t('inMotion'), value: inMotion },
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
    <section className="workspace-panel overflow-hidden" aria-label={t('eyebrow')}>
      {/* Eyebrow + grid only — no icon/headline/tagline. This app is
          explicitly not a marketing surface (UI_DESIGN.md §1/§2.2: "this app
          needs no hero type"); the sidebar already rejected the same pattern
          for its own product name (see shell/sidebar.tsx). */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 lg:px-6">
        <span className="utility-label text-text-muted">{t('eyebrow')}</span>
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
