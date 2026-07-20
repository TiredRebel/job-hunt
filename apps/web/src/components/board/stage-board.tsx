'use client';

/**
 * @module components/board/stage-board
 *
 * Kanban over reaction stages (stage-board spec). Five columns fed by
 * per-stage `GET /v1/jobs?reaction=&sortBy=board` queries; dnd-kit drag &
 * drop posts reaction events (cross-column) with optimistic updates + undo
 * toast, and persists manual card order (within-column, and the
 * destination column on a cross-column move) via `PUT /v1/board/order`
 * (design.md D3/D4/D5/D8 in
 * openspec/changes/notification-settings-and-board-reorder).
 */
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { StageColumn } from '@/components/board/stage-column';
import { StageCard } from '@/components/board/stage-card';
import { listJobs, type Job, type PaginatedJobs } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';
import { addReaction, setBoardOrder, type ReactionKind } from '@/lib/api/reactions';
import { useActiveProfile } from '@/lib/hooks/use-active-profile';

/** Canonical board stages (Rejected collapsed by default). */
export const BOARD_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;

/** A board column stage. */
export type BoardStage = (typeof BOARD_STAGES)[number];

/**
 * Build the query params shared by every per-stage board query — must stay
 * identical between the query definition and every optimistic-update cache
 * key lookup, or they silently target different cache entries.
 *
 * `limit: 100` — the gateway's `ListJobsQueryDto.limit` caps at 100
 * (`@Max(100)`); this file previously requested 200, a pre-existing bug
 * predating this change (found while verifying it live: every board load
 * 400'd) that made the whole page permanently broken. Fixed here since it
 * blocks board reordering entirely, not scoped further.
 *
 * @param stage - The stage to filter to.
 * @returns The `listJobs` params for that stage's column.
 */
function stageQueryParams(stage: BoardStage) {
  return { reaction: [stage], limit: 100, offset: 0, sortBy: 'board' as const };
}

/**
 * Stage board page body.
 *
 * @returns The kanban board.
 */
export function StageBoard() {
  const t = useTranslations('board');
  const tStages = useTranslations('stages');
  const queryClient = useQueryClient();
  const activeProfile = useActiveProfile();
  const [collapsedRejected, setCollapsedRejected] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const stageQueries = useQueries({
    queries: BOARD_STAGES.map((stage) => ({
      queryKey: queryKeys.jobs.list(stageQueryParams(stage)),
      queryFn: ({ signal }: { signal?: AbortSignal }) => listJobs(stageQueryParams(stage), signal),
    })),
  });

  const jobsByStage = useMemo(() => {
    const map = new Map<BoardStage, Job[]>();
    for (let index = 0; index < BOARD_STAGES.length; index += 1) {
      const stage = BOARD_STAGES[index]!;
      const items = (stageQueries[index]?.data?.items ?? []) as Job[];
      map.set(stage, [...items]);
    }
    return map;
  }, [stageQueries]);

  const findStageForJob = useCallback(
    (jobId: string): BoardStage | null => {
      for (const stage of BOARD_STAGES) {
        if ((jobsByStage.get(stage) ?? []).some((job) => job.id === jobId)) {
          return stage;
        }
      }
      return null;
    },
    [jobsByStage],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Best-effort: persist a column's current cache order to the server.
   * Failure here must not roll back anything that already succeeded —
   * order is cosmetic and self-heals on the next reorder (D3/D5).
   *
   * @param stage - The column whose order to persist.
   */
  const persistOrderBestEffort = useCallback(
    (stage: BoardStage): void => {
      const profileId = activeProfile.data?.id;
      const current = queryClient.getQueryData<PaginatedJobs>(
        queryKeys.jobs.list(stageQueryParams(stage)),
      );
      if (!profileId || !current) {
        return;
      }
      void setBoardOrder({
        profileId: String(profileId),
        stage,
        jobIds: current.items.map((job) => job.id),
      }).catch(() => {
        // Cosmetic only — the next reorder or cross-column move rewrites
        // the whole column's order anyway.
      });
    },
    [activeProfile.data?.id, queryClient],
  );

  const moveMutation = useMutation({
    mutationFn: async (vars: {
      jobId: string;
      toStage: BoardStage;
      fromStage: BoardStage;
      dropIndex: number;
    }) => {
      const profileId = activeProfile.data?.id;
      if (!profileId) {
        throw new Error('No active profile');
      }
      return addReaction({
        jobId: vars.jobId,
        profileId: String(profileId),
        reaction: vars.toStage as ReactionKind,
      });
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.all });
      const fromKey = queryKeys.jobs.list(stageQueryParams(vars.fromStage));
      const toKey = queryKeys.jobs.list(stageQueryParams(vars.toStage));
      const previousFrom = queryClient.getQueryData<PaginatedJobs>(fromKey);
      const previousTo = queryClient.getQueryData<PaginatedJobs>(toKey);
      const moving = previousFrom?.items.find((job) => job.id === vars.jobId);

      if (previousFrom && moving) {
        queryClient.setQueryData<PaginatedJobs>(fromKey, {
          ...previousFrom,
          items: previousFrom.items.filter((job) => job.id !== vars.jobId),
          total: Math.max(0, previousFrom.total - 1),
        });
      }
      if (previousTo && moving) {
        const insertAt = Math.min(vars.dropIndex, previousTo.items.length);
        const nextItems = [...previousTo.items];
        nextItems.splice(insertAt, 0, { ...moving, currentReaction: vars.toStage });
        queryClient.setQueryData<PaginatedJobs>(toKey, {
          ...previousTo,
          items: nextItems,
          total: previousTo.total + 1,
        });
      }

      return { previousFrom, previousTo, fromKey, toKey, vars };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousFrom) {
        queryClient.setQueryData(context.fromKey, context.previousFrom);
      }
      if (context?.previousTo) {
        queryClient.setQueryData(context.toKey, context.previousTo);
      }
      toast.error(t('moveError'));
      setLiveMessage(t('announceFailed'));
    },
    onSuccess: (_result, vars) => {
      const jobTitle =
        queryClient
          .getQueryData<PaginatedJobs>(queryKeys.jobs.list(stageQueryParams(vars.toStage)))
          ?.items.find((job) => job.id === vars.jobId)?.title ?? vars.jobId;
      setLiveMessage(t('announceMoved', { title: jobTitle, stage: tStages(vars.toStage) }));
      toast.success(t('moveSuccess'), {
        action: {
          label: t('undo'),
          onClick: () => {
            moveMutation.mutate({
              jobId: vars.jobId,
              fromStage: vars.toStage,
              toStage: vars.fromStage,
              dropIndex: 0,
            });
          },
        },
      });
      // The optimistic update in onMutate already placed the card at
      // vars.dropIndex in the destination column's cache — persist that
      // real order now that the stage change itself has succeeded.
      persistOrderBestEffort(vars.toStage);
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (vars: { stage: BoardStage; jobIds: readonly string[]; jobId: string }) => {
      const profileId = activeProfile.data?.id;
      if (!profileId) {
        throw new Error('No active profile');
      }
      await setBoardOrder({ profileId: String(profileId), stage: vars.stage, jobIds: vars.jobIds });
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.all });
      const key = queryKeys.jobs.list(stageQueryParams(vars.stage));
      const previous = queryClient.getQueryData<PaginatedJobs>(key);
      if (previous) {
        const byId = new Map(previous.items.map((job) => [job.id, job]));
        const reordered = vars.jobIds
          .map((id) => byId.get(id))
          .filter((job): job is Job => job !== undefined);
        queryClient.setQueryData<PaginatedJobs>(key, { ...previous, items: reordered });
      }
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
      toast.error(t('reorderError'));
      setLiveMessage(t('announceFailed'));
    },
    onSuccess: (_result, vars) => {
      const jobTitle =
        queryClient
          .getQueryData<PaginatedJobs>(queryKeys.jobs.list(stageQueryParams(vars.stage)))
          ?.items.find((job) => job.id === vars.jobId)?.title ?? vars.jobId;
      setLiveMessage(t('announceReordered', { title: jobTitle, stage: tStages(vars.stage) }));
    },
  });

  const handleDragStart = (event: DragStartEvent): void => {
    const jobId = String(event.active.id);
    for (const stage of BOARD_STAGES) {
      const job = (jobsByStage.get(stage) ?? []).find((item) => item.id === jobId);
      if (job) {
        setActiveJob(job);
        setLiveMessage(t('announceLifted', { title: job.title }));
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveJob(null);
    const jobId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId) {
      setLiveMessage(t('announceCancelled'));
      return;
    }

    const fromStage = findStageForJob(jobId);
    const overStr = String(overId);
    const toStage = (BOARD_STAGES as readonly string[]).includes(overStr)
      ? (overStr as BoardStage)
      : findStageForJob(overStr);

    if (!fromStage || !toStage) {
      setLiveMessage(t('announceCancelled'));
      return;
    }

    const destinationJobs = jobsByStage.get(toStage) ?? [];
    // Dropped directly on the column (empty area, or the column's own
    // droppable) lands at the end; dropped on a card lands at that card's
    // index.
    const overIndex = (BOARD_STAGES as readonly string[]).includes(overStr)
      ? destinationJobs.length
      : destinationJobs.findIndex((job) => job.id === overStr);

    if (fromStage === toStage) {
      const oldIndex = destinationJobs.findIndex((job) => job.id === jobId);
      if (oldIndex === -1 || overIndex === -1 || oldIndex === overIndex) {
        setLiveMessage(t('announceCancelled'));
        return;
      }
      const newOrder = arrayMove(destinationJobs, oldIndex, overIndex).map((job) => job.id);
      reorderMutation.mutate({ stage: fromStage, jobIds: newOrder, jobId });
      return;
    }

    moveMutation.mutate({
      jobId,
      fromStage,
      toStage,
      dropIndex: overIndex === -1 ? destinationJobs.length : overIndex,
    });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveJob(null);
          setLiveMessage(t('announceCancelled'));
        }}
      >
        <div className="flex h-full gap-3 overflow-x-auto pb-2">
          {BOARD_STAGES.map((stage, index) => {
            const jobs = jobsByStage.get(stage) ?? [];
            const collapsed = stage === 'rejected' && collapsedRejected;
            return (
              <StageColumn
                key={stage}
                stage={stage}
                jobs={jobs}
                collapsed={collapsed}
                loading={stageQueries[index]?.isLoading ?? false}
                {...(stage === 'rejected'
                  ? { onToggleCollapsed: () => setCollapsedRejected((value) => !value) }
                  : {})}
              />
            );
          })}
        </div>
        <DragOverlay>{activeJob ? <StageCard job={activeJob} dragging /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
