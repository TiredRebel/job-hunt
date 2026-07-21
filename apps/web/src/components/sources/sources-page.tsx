'use client';

/**
 * @module components/sources/sources-page
 *
 * Sources admin (sources-admin spec): enable toggle, cron hint, Run now,
 * and expandable run history per source.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Pencil, Play, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Locale } from '@job-hunter/shared-ts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  listAdapters,
  listSources,
  setSourceEnabled,
  testSource,
  triggerScrape,
  type ScrapeRun,
  type Source,
  type SourceTestResult,
} from '@/lib/api/sources';
import { cronFromConfig, cronToHint } from '@/lib/cron-hint';
import { formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { SourceFormDialog } from './source-form-dialog';

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
export function sourceRunCounts(stats: ScrapeRun['stats']): { found: number; neu: number } {
  return {
    found:
      typeof stats['discovered'] === 'number'
        ? stats['discovered']
        : typeof stats['found'] === 'number'
          ? stats['found']
          : 0,
    neu:
      typeof stats['inserted'] === 'number'
        ? stats['inserted']
        : typeof stats['new'] === 'number'
          ? stats['new']
          : 0,
  };
}

/**
 * Resolve the localized label for a connectivity-test outcome.
 *
 * @param t - Translator scoped to `sources`.
 * @param status - Test outcome.
 * @returns Localized label.
 */
/**
 * Format the parenthetical metadata for an `ok` test result — HTTP status
 * and elapsed milliseconds, whichever the scraper reported.
 *
 * @param t - Translator scoped to `sources`.
 * @param result - The test outcome.
 * @returns Joined metadata string, or `null` when neither field is present.
 */
function okResultMeta(
  t: ReturnType<typeof useTranslations<'sources'>>,
  result: SourceTestResult,
): string | null {
  const parts = [
    result.httpStatus !== null ? t('testHttpStatus', { status: result.httpStatus }) : null,
    result.elapsedMs !== null ? t('testElapsed', { ms: result.elapsedMs }) : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function testStatusLabel(
  t: ReturnType<typeof useTranslations<'sources'>>,
  status: SourceTestResult['status'],
): string {
  switch (status) {
    case 'ok':
      return t('testStatusOk');
    case 'no_adapter':
      return t('testStatusNoAdapter');
    case 'unsupported_strategy':
      return t('testStatusUnsupportedStrategy');
    case 'blocked':
      return t('testStatusBlocked');
    case 'failed':
      return t('testStatusFailed');
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

/** Props for a single source row. */
interface SourceRowProps {
  readonly source: Source;
  /** `undefined` while the adapter list is loading/unavailable — no badge shown. */
  readonly hasAdapter: boolean | undefined;
  readonly onEdit: (source: Source) => void;
}

/**
 * One source row with enable switch, schedule hint, run-now, edit, test, and
 * expandable history.
 *
 * @param props - Source row props.
 * @returns The row element.
 */
function SourceRow({ source, hasAdapter, onEdit }: SourceRowProps) {
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
    refetchInterval: (query) =>
      query.state.data?.some((run) => run.status === 'running') ? 2_000 : false,
    refetchIntervalInBackground: true,
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

  const testMutation = useMutation({
    mutationFn: () => testSource(source.slug),
    onSuccess: (result) => {
      const meta = result.status === 'ok' ? okResultMeta(t, result) : null;
      const description = [meta, result.detail]
        .filter((part): part is string => Boolean(part))
        .join(' · ');
      if (result.status === 'ok') {
        toast.success(testStatusLabel(t, result.status), { description });
      } else {
        toast.warning(testStatusLabel(t, result.status), { description });
      }
    },
    onError: () => toast.error(t('testError')),
  });

  const lastRun = runsQuery.data?.[0];
  const testMeta = testMutation.data?.status === 'ok' ? okResultMeta(t, testMutation.data) : null;
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
          <p className="flex items-center gap-2 truncate text-sm font-medium text-text-primary">
            {source.name}
            {hasAdapter === false && (
              <Badge variant="outline" className="border-warning text-warning">
                {t('noAdapterBadge')}
              </Badge>
            )}
          </p>
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
          size="icon"
          variant="ghost"
          onClick={() => onEdit(source)}
          aria-label={t('editLabel', { name: source.name })}
        >
          <Pencil aria-hidden="true" size={14} />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={testMutation.isPending}
              onClick={() => testMutation.mutate()}
              aria-label={t('testLabel', { name: source.name })}
            >
              <Zap aria-hidden="true" size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('testLabel', { name: source.name })}</TooltipContent>
        </Tooltip>

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

      {(testMutation.isPending || testMutation.data) && (
        <div className="border-t border-border px-4 py-2">
          {testMutation.isPending ? (
            <p className="text-xs text-text-muted">{t('testPending')}</p>
          ) : (
            testMutation.data && (
              <p className={cn('text-xs', testMutation.data.status !== 'ok' && 'text-warning')}>
                <span className="font-medium">{testStatusLabel(t, testMutation.data.status)}</span>
                {testMeta !== null && <span className="text-text-muted"> ({testMeta})</span>}
                {': '}
                {testMutation.data.detail}
              </p>
            )
          )}
        </div>
      )}

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
                  const counts = sourceRunCounts(run.stats);
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | undefined>(undefined);

  const sourcesQuery = useQuery({
    queryKey: queryKeys.sources.all,
    queryFn: ({ signal }) => listSources(signal),
  });

  // Adapter awareness degrades gracefully — a failed fetch just means no
  // "no adapter" badges render, not an error state for the whole page.
  const adaptersQuery = useQuery({
    queryKey: queryKeys.sources.adapters,
    queryFn: ({ signal }) => listAdapters(signal),
  });

  const openCreate = (): void => {
    setEditingSource(undefined);
    setDialogOpen(true);
  };

  const openEdit = (source: Source): void => {
    setEditingSource(source);
    setDialogOpen(true);
  };

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
  const adapterSlugs = adaptersQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
        <Button type="button" size="sm" onClick={openCreate}>
          {t('addSource')}
        </Button>
      </div>

      {sources.length === 0 ? (
        <p className="text-sm text-text-muted">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sources.map((source) => (
            <SourceRow
              key={source.slug}
              source={source}
              hasAdapter={adapterSlugs?.includes(source.slug)}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <div>
        <Button type="button" size="sm" onClick={openCreate}>
          {t('addSource')}
        </Button>
      </div>

      <SourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        source={editingSource}
        adapterSlugs={adapterSlugs}
      />
    </div>
  );
}
