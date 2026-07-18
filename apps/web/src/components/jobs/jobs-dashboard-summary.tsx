'use client';

/**
 * @module components/jobs/jobs-dashboard-summary
 *
 * Jobs-dashboard header panel: triage headline plus four at-a-glance metrics
 * (total, high-fit, in-motion, unreviewed) computed from the loaded rows.
 */
import { ArrowUpRight, ScanSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

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
    </section>
  );
}
