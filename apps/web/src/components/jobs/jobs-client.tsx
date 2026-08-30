'use client';

/**
 * @module components/jobs/jobs-client
 *
 * Client island for `/jobs`: filters, virtualized list, detail pane, focus
 * mode, bulk actions, and keyboard triage (docs/jobs-redesign.md).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RowSelectionState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { BulkActionBar } from '@/components/jobs/bulk-action-bar';
import { DetailPane } from '@/components/jobs/detail-pane';
import { FilterBar } from '@/components/jobs/filter-bar';
import { FocusMode } from '@/components/jobs/focus-mode';
import { JobCard } from '@/components/jobs/job-card';
import { JobsContextColumn } from '@/components/jobs/jobs-context-column';
import { JobsEmptyState } from '@/components/jobs/jobs-empty-state';
import { JobsDashboardSummary } from '@/components/jobs/jobs-dashboard-summary';
import { JobsPageHeader } from '@/components/jobs/jobs-page-header';
import { JobsPagination } from '@/components/jobs/jobs-pagination';
import { type SystemViewId } from '@/components/jobs/saved-view-tabs';
import { ShortcutsDialog } from '@/components/jobs/shortcuts-dialog';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useActiveProfile } from '@/lib/hooks/use-active-profile';
import { useJobsQuery } from '@/lib/hooks/use-jobs-query';
import { useKeyboardNav, type StageShortcut } from '@/lib/hooks/use-keyboard-nav';
import { useRelaxedScoreSuggestion } from '@/lib/hooks/use-relaxed-score-suggestion';
import {
  deleteJob,
  deleteJobs,
  setJobStatus,
  type JobsListParams,
  type PaginatedJobs,
} from '@/lib/api/jobs';
import { ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { addBulkReactions, addReaction, type ReactionKind } from '@/lib/api/reactions';
import { countActiveFilters, jobsListParamsToSearchParams } from '@/lib/jobs/search-params';
import { detectView, paramsForView } from '@/lib/jobs/saved-views';
import type { Locale } from '@job-hunter/shared-ts';
import type { JobRow } from '@/components/jobs/job-table-columns';

const JobTable = dynamic(() =>
  import('@/components/jobs/job-table').then((module) => module.JobTable),
);

const UNDO_MS = 8000;

/** Props accepted by {@link JobsClient}. */
export interface JobsClientProps {
  readonly initialData: PaginatedJobs;
  readonly params: JobsListParams;
  readonly locale: Locale;
}

type UndoAction = {
  readonly label: string;
  readonly run: () => void;
};

/**
 * Client-side jobs dashboard.
 *
 * @param props - Jobs client props.
 * @returns The jobs dashboard content.
 */
export function JobsClient({ initialData, params, locale }: JobsClientProps) {
  const t = useTranslations('jobs');
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const rawSearchParams = useSearchParams();

  const jobsQuery = useJobsQuery(params, initialData);
  const activeProfile = useActiveProfile();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [focusedJobId, setFocusedJobId] = useState<string | null>(null);
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [flashJobId, setFlashJobId] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const undoRef = useRef<UndoAction | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => jobsQuery.data?.items ?? [], [jobsQuery.data?.items]);
  const { total = 0, highFit = 0, inMotion = 0, unreviewed = 0 } = jobsQuery.data ?? {};
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const activeView =
    (rawSearchParams.get('view') as SystemViewId | null) ?? detectView(params) ?? 'unreviewed';

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(max-width: 767px)');
    const update = (): void => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Default to Unreviewed when the URL has no filters and no view.
  useEffect(() => {
    if (rawSearchParams.has('view') || countActiveFilters(params) > 0) {
      return;
    }
    const next = jobsListParamsToSearchParams(paramsForView('unreviewed', params));
    next.set('view', 'unreviewed');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, rawSearchParams, router]);

  const invalidateJobs = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
  }, [queryClient]);

  const replaceParams = useCallback(
    (nextParams: JobsListParams, view?: string | null) => {
      const next = jobsListParamsToSearchParams(nextParams);
      if (view) {
        next.set('view', view);
      }
      const search = next.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const pushUndo = useCallback(
    (action: UndoAction) => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      undoRef.current = action;
      toast(action.label, {
        duration: UNDO_MS,
        action: {
          label: t('bulk.undo'),
          onClick: () => {
            undoRef.current?.run();
            undoRef.current = null;
          },
        },
      });
      undoTimerRef.current = setTimeout(() => {
        undoRef.current = null;
      }, UNDO_MS);
    },
    [t],
  );

  const runUndo = useCallback(() => {
    if (!undoRef.current) {
      return;
    }
    undoRef.current.run();
    undoRef.current = null;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
  }, []);

  const bulkMutation = useMutation({
    mutationFn: (vars: { jobIds: readonly string[]; reaction: ReactionKind }) => {
      const profileId = activeProfile.data?.id;
      if (!profileId) {
        throw new Error('No active profile');
      }
      return addBulkReactions({
        jobIds: vars.jobIds,
        profileId: String(profileId),
        reaction: vars.reaction,
      });
    },
    onSuccess: (_result, vars) => {
      invalidateJobs();
      setRowSelection({});
      pushUndo({
        label: t('bulk.success', { count: vars.jobIds.length }),
        run: () => invalidateJobs(),
      });
    },
    onError: () => toast.error(t('bulk.error')),
  });

  const singleReactionMutation = useMutation({
    mutationFn: (vars: { jobId: string; reaction: ReactionKind }) => {
      const profileId = activeProfile.data?.id;
      if (!profileId) {
        throw new Error('No active profile');
      }
      return addReaction({
        jobId: vars.jobId,
        profileId: String(profileId),
        reaction: vars.reaction,
      });
    },
    onSuccess: (_result, vars) => {
      invalidateJobs();
      pushUndo({
        label: t('bulk.success', { count: 1 }),
        run: () => {
          void vars;
          invalidateJobs();
        },
      });
      if (focusMode) {
        const idx = rowIds.indexOf(vars.jobId);
        const nextId = rowIds[idx + 1] ?? rowIds[idx - 1] ?? null;
        if (nextId) {
          setFocusedJobId(nextId);
        } else {
          setFocusMode(false);
        }
      }
    },
    onError: () => toast.error(t('bulk.error')),
  });

  const hideMutation = useMutation({
    mutationFn: (jobId: string) => setJobStatus(jobId, 'hidden'),
    onSuccess: (_result, jobId) => {
      invalidateJobs();
      pushUndo({
        label: t('bulk.hideSuccess'),
        run: () => {
          void setJobStatus(jobId, 'processed').then(() => invalidateJobs());
        },
      });
    },
    onError: () => toast.error(t('bulk.error')),
  });

  const pendingDeletesRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleDelete = useCallback(
    (job: { readonly id: string; readonly title: string }) => {
      const existing = pendingDeletesRef.current.get(job.id);
      if (existing) {
        clearTimeout(existing);
      }
      setRowSelection((previous) => {
        if (!previous[job.id]) {
          return previous;
        }
        const next = { ...previous };
        delete next[job.id];
        return next;
      });
      setFocusedJobId((current) => (current === job.id ? null : current));
      if (detailJobId === job.id) {
        setDetailOpen(false);
        setDetailJobId(null);
      }
      // Soft window: hide from list optimistically; commit after UNDO_MS.
      queryClient.setQueriesData<PaginatedJobs>({ queryKey: queryKeys.jobs.all }, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          items: current.items.filter((item) => item.id !== job.id),
          total: Math.max(0, current.total - 1),
        };
      });
      const timer = setTimeout(() => {
        pendingDeletesRef.current.delete(job.id);
        void deleteJob(job.id)
          .then(() => invalidateJobs())
          .catch((error: unknown) => {
            toast.error(
              error instanceof ApiError && error.status === 404
                ? t('delete.notFound')
                : t('delete.error'),
            );
            invalidateJobs();
          });
      }, UNDO_MS);
      pendingDeletesRef.current.set(job.id, timer);
      pushUndo({
        label: t('delete.success', { title: job.title }),
        run: () => {
          const pending = pendingDeletesRef.current.get(job.id);
          if (pending) {
            clearTimeout(pending);
            pendingDeletesRef.current.delete(job.id);
          }
          invalidateJobs();
        },
      });
    },
    [detailJobId, invalidateJobs, pushUndo, queryClient, t],
  );

  const scheduleBulkDelete = useCallback(
    (jobIds: readonly string[]) => {
      for (const id of jobIds) {
        const existing = pendingDeletesRef.current.get(id);
        if (existing) {
          clearTimeout(existing);
        }
      }
      setRowSelection({});
      setFocusedJobId((current) => (current && jobIds.includes(current) ? null : current));
      if (detailJobId && jobIds.includes(detailJobId)) {
        setDetailOpen(false);
        setDetailJobId(null);
      }
      queryClient.setQueriesData<PaginatedJobs>({ queryKey: queryKeys.jobs.all }, (current) => {
        if (!current) {
          return current;
        }
        const remove = new Set(jobIds);
        return {
          ...current,
          items: current.items.filter((item) => !remove.has(item.id)),
          total: Math.max(0, current.total - jobIds.length),
        };
      });
      const timer = setTimeout(() => {
        for (const id of jobIds) {
          pendingDeletesRef.current.delete(id);
        }
        void deleteJobs(jobIds)
          .then(() => invalidateJobs())
          .catch(() => {
            toast.error(t('bulk.deleteError'));
            invalidateJobs();
          });
      }, UNDO_MS);
      for (const id of jobIds) {
        pendingDeletesRef.current.set(id, timer);
      }
      pushUndo({
        label: t('bulk.deleteSuccess', { count: jobIds.length }),
        run: () => {
          clearTimeout(timer);
          for (const id of jobIds) {
            pendingDeletesRef.current.delete(id);
          }
          invalidateJobs();
        },
      });
    },
    [detailJobId, invalidateJobs, pushUndo, queryClient, t],
  );

  const openDetail = useCallback(
    (jobId: string, fullPage: boolean) => {
      if (fullPage) {
        router.push(`/jobs/${jobId}`);
        return;
      }
      setFocusedJobId(jobId);
      setDetailJobId(jobId);
      setDetailOpen(true);
    },
    [router],
  );

  const handleStage = useCallback(
    (jobId: string, stage: StageShortcut) => {
      singleReactionMutation.mutate({ jobId, reaction: stage });
    },
    [singleReactionMutation],
  );

  const handleHide = useCallback(
    (jobId: string) => {
      hideMutation.mutate(jobId);
    },
    [hideMutation],
  );

  const exitFocusMode = useCallback(() => {
    setFocusMode(false);
    if (focusedJobId) {
      setFlashJobId(focusedJobId);
      window.setTimeout(() => setFlashJobId(null), 600);
      const row = document.querySelector<HTMLElement>(
        `[data-job-id="${CSS.escape(focusedJobId)}"]`,
      );
      row?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedJobId]);

  const handleKeyDown = useKeyboardNav({
    rowIds,
    focusedId: focusedJobId,
    onFocusChange: setFocusedJobId,
    onToggleSelect: (id) => setRowSelection((prev) => ({ ...prev, [id]: !prev[id] })),
    onExtendSelect: (id) => setRowSelection((prev) => ({ ...prev, [id]: true })),
    onSelectAll: () => {
      const next: RowSelectionState = {};
      for (const id of rowIds) {
        next[id] = true;
      }
      setRowSelection(next);
    },
    onOpenDetail: (id) => openDetail(id, false),
    onToggleFocusMode: () => {
      if (focusMode) {
        exitFocusMode();
      } else {
        if (!focusedJobId && rowIds[0]) {
          setFocusedJobId(rowIds[0]);
        }
        setFocusMode(true);
      }
    },
    onToggleDetail: () => {
      if (detailOpen) {
        setDetailOpen(false);
      } else if (focusedJobId) {
        setDetailJobId(focusedJobId);
        setDetailOpen(true);
      }
    },
    onStage: handleStage,
    onHide: handleHide,
    onUndo: runUndo,
    onFocusSearch: () => searchInputRef.current?.focus(),
    onShowHelp: () => setShortcutsOpen(true),
    onEscape: () => {
      if (focusMode) {
        exitFocusMode();
        return;
      }
      if (detailOpen) {
        setDetailOpen(false);
        return;
      }
      if (selectedIds.length > 0) {
        setRowSelection({});
      }
    },
    global: focusMode,
  });

  const activeFilterCount = countActiveFilters(params);
  const isEmpty = !jobsQuery.isLoading && rows.length === 0;
  const scoreSuggestion = useRelaxedScoreSuggestion(params, isEmpty && activeFilterCount > 0);
  const focusedJob = rows.find((row) => row.id === focusedJobId) ?? null;
  const focusIndex = focusedJobId ? rowIds.indexOf(focusedJobId) : 0;

  const copyLink = useCallback(
    async (job: JobRow) => {
      try {
        await navigator.clipboard.writeText(job.url);
        toast.success(t('rowActions.copied'));
      } catch {
        toast.error(t('rowActions.copyFailed'));
      }
    },
    [t],
  );

  return (
    <div className="relative flex min-h-full flex-col gap-0">
      <div className="flex min-h-0 flex-1 gap-0">
        <JobsContextColumn
          activeView={activeView}
          counts={{ unreviewed, highFit, inMotion }}
          unreviewed={unreviewed}
          total={total}
          onSelectView={(view) => {
            const systemView = view as SystemViewId;
            replaceParams(paramsForView(systemView, params), systemView);
          }}
          onCreateView={() => {
            const name = window.prompt(t('filters.saveAsView'));
            if (!name?.trim()) {
              return;
            }
            try {
              const key = 'job-hunter-user-views';
              const existing = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown[];
              const next = [...existing, { id: `user-${Date.now()}`, name: name.trim(), params }];
              window.localStorage.setItem(key, JSON.stringify(next));
              toast.success(t('views.saved'));
            } catch {
              toast.error(t('bulk.error'));
            }
          }}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-0 min-[1024px]:pl-3">
          <JobsPageHeader
            total={total}
            unreviewed={unreviewed}
            scrollParentRef={scrollContainerRef}
          />

          <JobsDashboardSummary
            total={total}
            highFit={highFit}
            inMotion={inMotion}
            unreviewed={unreviewed}
          />

          <FilterBar
            params={params}
            searchInputRef={searchInputRef}
            onSaveView={() => {
              const name = window.prompt(t('filters.saveAsView'));
              if (!name?.trim()) {
                return;
              }
              try {
                const key = 'job-hunter-user-views';
                const existing = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown[];
                window.localStorage.setItem(
                  key,
                  JSON.stringify([
                    ...existing,
                    { id: `user-${Date.now()}`, name: name.trim(), params },
                  ]),
                );
                toast.success(t('views.saved'));
              } catch {
                toast.error(t('bulk.error'));
              }
            }}
          />

          <div className="relative flex min-h-[300px] flex-1 gap-0">
            <div
              ref={scrollContainerRef}
              className="workspace-panel relative min-h-[300px] min-w-0 flex-1 overflow-y-auto"
              tabIndex={0}
              role="region"
              aria-label={t('title')}
              onKeyDown={handleKeyDown}
            >
              {isEmpty ? (
                <JobsEmptyState
                  variant={
                    activeFilterCount > 0 || activeView === 'unreviewed' ? 'no-results' : 'no-jobs'
                  }
                  onReset={() => router.replace(pathname, { scroll: false })}
                  suggestion={scoreSuggestion}
                  onApplySuggestion={
                    scoreSuggestion
                      ? () => {
                          replaceParams({
                            ...params,
                            scoreMin: scoreSuggestion.scoreMin,
                            offset: 0,
                          });
                        }
                      : undefined
                  }
                />
              ) : isMobile ? (
                <div className="flex flex-col gap-[var(--list-row-gap,12px)] p-3">
                  {rows.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      selected={Boolean(rowSelection[job.id])}
                      focused={focusedJobId === job.id}
                      onOpen={() => openDetail(job.id, false)}
                      onSave={() => handleStage(job.id, 'saved')}
                      onReject={() => handleStage(job.id, 'rejected')}
                    />
                  ))}
                </div>
              ) : (
                <JobTable
                  rows={rows}
                  total={total}
                  params={params}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                  focusedJobId={focusedJobId}
                  flashJobId={flashJobId}
                  onFocusRow={setFocusedJobId}
                  onOpenJob={openDetail}
                  onDeleteJob={(job) => scheduleDelete(job)}
                  onHideJob={(job) => handleHide(job.id)}
                  onCopyLink={(job) => {
                    void copyLink(job);
                  }}
                  onStageChange={(job, stage) => handleStage(job.id, stage)}
                  scrollContainerRef={scrollContainerRef}
                  locale={locale}
                />
              )}

              <BulkActionBar
                count={selectedIds.length}
                pending={bulkMutation.isPending || hideMutation.isPending}
                onMarkApplied={() =>
                  bulkMutation.mutate({ jobIds: selectedIds, reaction: 'applied' })
                }
                onSave={() => bulkMutation.mutate({ jobIds: selectedIds, reaction: 'saved' })}
                onSetStage={(stage) =>
                  bulkMutation.mutate({ jobIds: selectedIds, reaction: stage })
                }
                onReject={() => bulkMutation.mutate({ jobIds: selectedIds, reaction: 'rejected' })}
                onHide={() => {
                  for (const id of selectedIds) {
                    hideMutation.mutate(id);
                  }
                  setRowSelection({});
                }}
                onDelete={() => scheduleBulkDelete(selectedIds)}
                onClear={() => setRowSelection({})}
              />
            </div>

            <DetailPane
              jobId={detailJobId}
              open={detailOpen}
              onClose={() => setDetailOpen(false)}
              onDeleted={() => {
                setDetailJobId(null);
                setDetailOpen(false);
              }}
            />
          </div>

          <JobsPagination params={params} total={total} />

          {!isEmpty && (
            <p className="flex items-center gap-2 px-1 text-xs text-[var(--text-secondary)]">
              <span className="utility-label">{t('keysHint.label')}</span>
              {t('keysHint.text')}
            </p>
          )}
        </div>
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {focusMode && focusedJob && (
        <FocusMode
          job={focusedJob}
          index={Math.max(0, focusIndex)}
          total={rows.length}
          onClose={exitFocusMode}
          onStage={(stage) => handleStage(focusedJob.id, stage)}
          onHide={() => handleHide(focusedJob.id)}
          onUndo={runUndo}
        />
      )}

      <p role="status" className="sr-only">
        {selectedIds.length > 0 ? t('bulk.selected', { count: selectedIds.length }) : ''}
      </p>
    </div>
  );
}
