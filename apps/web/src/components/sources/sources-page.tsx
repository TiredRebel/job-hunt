'use client';

/**
 * @module components/sources/sources-page
 *
 * Sources admin (sources-admin spec): enable toggle, cron hint, Run now,
 * and expandable run history per source.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Locale } from '@job-hunter/shared-ts';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getSourceRuns,
  listSources,
  setSourceEnabled,
  triggerScrape,
  type ScrapeRun,
  type Source,
} from '@/lib/api/sources';
import { cronFromConfig, cronToHint } from '@/lib/cron-hint';
import { formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

/**
 * Format a run duration in seconds (monospace).
 *
 * @param run - Scrape run.
 * @returns Duration label, or `—` when still running / unknown.
 */
function formatDuration(run: ScrapeRun): string {
  if (!run.finishedAt) {
    return '—';
  }
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) {
    return '—';
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/**
 * Resolve found/new counts from the opaque stats bag.
 *
 * @param stats - Run stats.
 * @returns Display pair.
 */
function statsCounts(stats: ScrapeRun['stats']): { found: number; neu: number } {
  return {
    found: typeof stats['found'] === 'number' ? stats['found'] : 0,
    neu: typeof stats['new'] === 'number' ? stats['new'] : 0,
  };
}

/** Props for a single source row. */
interface SourceRowProps {
  readonly source: Source;
}

/**
 * One source row with enable switch, schedule hint, run-now, and history.
 *
 * @param props - Source row props.
 * @returns The row element.
 */
function SourceRow({ source }: SourceRowProps) {
  const t = useTranslations('sources');
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const cron = cronFromConfig(source.config);
  const cronHint = cronToHint(cron);

  const runsQuery = useQuery({
    queryKey: queryKeys.sources.runs(source.slug, { limit: 10, offset: 0 }),
    queryFn: ({ signal }) => getSourceRuns(source.slug, { limit: 10, offset: 0 }, signal),
    enabled: expanded,
  });

  const enableMutation = useMutation({
    mutationFn: (enabled: boolean) => setSourceEnabled(source.slug, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sources.all });
      toast.success(t('enableSuccess'));
    },
    onError: () => toast.error(t('enableError')),
  });

  const scrapeMutation = useMutation({
    mutationFn: () => triggerScrape(source.slug),
    onSuccess: async () => {
      toast.success(t('scrapeAccepted'));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sources.runs(source.slug, { limit: 10, offset: 0 }),
      });
      setExpanded(true);
    },
    onError: () => toast.error(t('scrapeError')),
  });

  const lastRun = runsQuery.data?.[0];
  const statusLabel = (status: ScrapeRun['status']): string => {
    switch (status) {
      case 'running':
        return t('statusRunning');
      case 'success':
        return t('statusSuccess');
      case 'partial':
        return t('statusPartial');
      case 'failed':
        return t('statusFailed');
      default: {
        const exhaustive: never = status;
        return exhaustive;
      }
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={expanded ? t('collapseHistory') : t('expandHistory')}
          className="text-text-muted hover:text-text-primary"
        >
          {expanded ? (
            <ChevronDown aria-hidden="true" size={16} />
          ) : (
            <ChevronRight aria-hidden="true" size={16} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{source.name}</p>
          <p className="truncate font-mono text-xs text-text-muted">{source.slug}</p>
        </div>

        <label className="flex items-center gap-2 text-xs text-text-muted">
          <Switch
            checked={source.enabled}
            disabled={enableMutation.isPending}
            onCheckedChange={(checked) => enableMutation.mutate(checked)}
            aria-label={t('enableLabel', { name: source.name })}
          />
          {source.enabled ? t('enabled') : t('disabled')}
        </label>

        <div className="min-w-32 text-xs text-text-muted">
          <p className="font-mono">{cron ?? t('scheduleUnknown')}</p>
          {cronHint && cronHint !== cron && <p>{cronHint}</p>}
          {!cron && <p>{t('scheduleManaged')}</p>}
        </div>

        <div className="min-w-28 text-xs text-text-muted">
          {expanded && lastRun ? (
            <>
              <p
                className={cn(
                  lastRun.status === 'failed' || lastRun.status === 'partial' ? 'text-warning' : '',
                )}
              >
                {statusLabel(lastRun.status)}
              </p>
              <p className="tabular-nums font-mono">{formatDateTime(lastRun.startedAt, locale)}</p>
            </>
          ) : (
            <p>{expanded ? t('noRuns') : t('expandForLastRun')}</p>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={scrapeMutation.isPending || !source.enabled}
          onClick={() => scrapeMutation.mutate()}
          className="gap-1.5"
        >
          <Play aria-hidden="true" size={12} />
          {t('runNow')}
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <h3 className="mb-2 text-xs font-medium text-text-muted">{t('runHistory')}</h3>
          {runsQuery.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (runsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-text-muted">{t('noRuns')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colStarted')}</TableHead>
                  <TableHead>{t('colDuration')}</TableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <TableHead>{t('colFound')}</TableHead>
                  <TableHead>{t('colNew')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(runsQuery.data ?? []).map((run) => {
                  const counts = statsCounts(run.stats);
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="tabular-nums font-mono text-xs">
                        {formatDateTime(run.startedAt, locale)}
                      </TableCell>
                      <TableCell className="tabular-nums font-mono text-xs">
                        {formatDuration(run)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-xs',
                          (run.status === 'failed' || run.status === 'partial') && 'text-warning',
                        )}
                      >
                        {statusLabel(run.status)}
                      </TableCell>
                      <TableCell className="tabular-nums font-mono text-xs">
                        {counts.found}
                      </TableCell>
                      <TableCell className="tabular-nums font-mono text-xs">{counts.neu}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sources admin page body.
 *
 * @returns The sources page content.
 */
export function SourcesPageClient() {
  const t = useTranslations('sources');
  const sourcesQuery = useQuery({
    queryKey: queryKeys.sources.all,
    queryFn: ({ signal }) => listSources(signal),
  });

  if (sourcesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (sourcesQuery.isError) {
    return <p className="text-sm text-destructive">{t('loadError')}</p>;
  }

  const sources = sourcesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
      {sources.length === 0 ? (
        <p className="text-sm text-text-muted">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sources.map((source) => (
            <SourceRow key={source.slug} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
