'use client';

/**
 * @module components/jobs/jobs-client
 *
 * Client island orchestrating the `/jobs` page: FilterBar, JobTable,
 * BulkActionBar, and the keyboard-nav/shortcuts-dialog glue between them.
 * The server page fetches page 1 and passes it here as `initialData`
 * (design.md D1/D2); everything past first paint is TanStack Query.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RowSelectionState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { BulkActionBar } from '@/components/jobs/bulk-action-bar';
import { FilterBar } from '@/components/jobs/filter-bar';
import { JobsEmptyState } from '@/components/jobs/jobs-empty-state';
import { JobsDashboardSummary } from '@/components/jobs/jobs-dashboard-summary';
import { ShortcutsDialog } from '@/components/jobs/shortcuts-dialog';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useActiveProfile } from '@/lib/hooks/use-active-profile';
import { useJobsQuery } from '@/lib/hooks/use-jobs-query';
import { useKeyboardNav } from '@/lib/hooks/use-keyboard-nav';
import type { JobsListParams, PaginatedJobs } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';
import { addBulkReactions, addReaction, type ReactionKind } from '@/lib/api/reactions';
import { countActiveFilters } from '@/lib/jobs/search-params';
import type { Locale } from '@job-hunter/shared-ts';

const JobDrawer = dynamic(
  () => import('@/components/jobs/job-drawer').then((module) => module.JobDrawer),
  { ssr: false },
);
const JobTable = dynamic(() =>
  import('@/components/jobs/job-table').then((module) => module.JobTable),
);

/** Props accepted by {@link JobsClient}. */
export interface JobsClientProps {
  readonly initialData: PaginatedJobs;
  readonly params: JobsListParams;
  readonly locale: Locale;
}

/**
 * Client-side jobs dashboard: filters, table, bulk actions, keyboard flow.
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => jobsQuery.data?.items ?? [], [jobsQuery.data?.items]);
  const total = jobsQuery.data?.total ?? 0;
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const invalidateJobs = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
  }, [queryClient]);

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
      toast.success(t('bulk.success', { count: vars.jobIds.length }));
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
    onSuccess: () => invalidateJobs(),
    onError: () => toast.error(t('bulk.error')),
  });

  const openJob = useCallback(
    (jobId: string, fullPage: boolean) => {
      if (fullPage) {
        router.push(`/jobs/${jobId}`);
        return;
      }
      const next = new URLSearchParams(rawSearchParams.toString());
      next.set('job', jobId);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, rawSearchParams, router],
  );

  const handleMarkApplied = useCallback(
    (jobId: string) => singleReactionMutation.mutate({ jobId, reaction: 'applied' }),
    [singleReactionMutation],
  );

  const handleReject = useCallback(
    (jobId: string) => {
      if (window.confirm(t('bulk.confirmReject', { count: 1 }))) {
        singleReactionMutation.mutate({ jobId, reaction: 'rejected' });
      }
    },
    [singleReactionMutation, t],
  );

  const handleKeyDown = useKeyboardNav({
    rowIds,
    focusedId: focusedJobId,
    onFocusChange: setFocusedJobId,
    onToggleSelect: (id) => setRowSelection((prev) => ({ ...prev, [id]: !prev[id] })),
    onOpen: (id) => openJob(id, false),
    onMarkApplied: handleMarkApplied,
    onReject: handleReject,
    onFocusSearch: () => searchInputRef.current?.focus(),
    onShowHelp: () => setShortcutsOpen(true),
  });

  const activeFilterCount = countActiveFilters(params);
  const isEmpty = !jobsQuery.isLoading && rows.length === 0;

  return (
    <div className="flex min-h-full flex-col gap-4">
      <JobsDashboardSummary rows={rows} total={total} />
      <FilterBar params={params} searchInputRef={searchInputRef} />
      <div
        ref={scrollContainerRef}
        className="workspace-panel min-h-[300px] flex-1 overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label={t('title')}
        onKeyDown={handleKeyDown}
        onKeyDownCapture={(event) => {
          if (event.key === 'Escape' && selectedIds.length > 0) {
            setRowSelection({});
          }
        }}
      >
        {isEmpty ? (
          <JobsEmptyState
            variant={activeFilterCount > 0 ? 'no-results' : 'no-jobs'}
            onReset={() => router.replace(pathname, { scroll: false })}
          />
        ) : (
          <JobTable
            rows={rows}
            params={params}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            focusedJobId={focusedJobId}
            onFocusRow={setFocusedJobId}
            onOpenJob={openJob}
            scrollContainerRef={scrollContainerRef}
            locale={locale}
          />
        )}
      </div>

      <BulkActionBar
        count={selectedIds.length}
        pending={bulkMutation.isPending}
        onMarkApplied={() => bulkMutation.mutate({ jobIds: selectedIds, reaction: 'applied' })}
        onSave={() => bulkMutation.mutate({ jobIds: selectedIds, reaction: 'saved' })}
        onSetStage={(stage) => bulkMutation.mutate({ jobIds: selectedIds, reaction: stage })}
        onReject={() => bulkMutation.mutate({ jobIds: selectedIds, reaction: 'rejected' })}
        onClear={() => setRowSelection({})}
      />

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      {rawSearchParams.has('job') && <JobDrawer />}

      <p className="sr-only" aria-live="polite">
        {total > 0 ? `${total}` : ''}
      </p>
    </div>
  );
}
