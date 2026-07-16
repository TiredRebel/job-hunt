'use client';

/**
 * @module components/board/stage-board
 *
 * Kanban over reaction stages (stage-board spec). Five columns fed by
 * per-stage `GET /v1/jobs?reaction=` queries; dnd-kit drag & drop posts
 * reaction events with optimistic updates + undo toast.
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
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { StageColumn } from '@/components/board/stage-column';
import { StageCard } from '@/components/board/stage-card';
import { listJobs, type Job, type PaginatedJobs } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';
import { addReaction, type ReactionKind } from '@/lib/api/reactions';
import { useActiveProfile } from '@/lib/hooks/use-active-profile';

/** Canonical board stages (Rejected collapsed by default). */
export const BOARD_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;

/** A board column stage. */
export type BoardStage = (typeof BOARD_STAGES)[number];

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
      queryKey: queryKeys.jobs.list({ reaction: [stage], limit: 200, offset: 0 }),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        listJobs({ reaction: [stage], limit: 200, offset: 0 }, signal),
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
    useSensor(KeyboardSensor),
  );

  const moveMutation = useMutation({
    mutationFn: async (vars: { jobId: string; toStage: BoardStage; fromStage: BoardStage }) => {
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
      const fromKey = queryKeys.jobs.list({ reaction: [vars.fromStage], limit: 200, offset: 0 });
      const toKey = queryKeys.jobs.list({ reaction: [vars.toStage], limit: 200, offset: 0 });
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
        queryClient.setQueryData<PaginatedJobs>(toKey, {
          ...previousTo,
          items: [{ ...moving, currentReaction: vars.toStage }, ...previousTo.items],
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
          .getQueryData<PaginatedJobs>(
            queryKeys.jobs.list({ reaction: [vars.toStage], limit: 200, offset: 0 }),
          )
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
            });
          },
        },
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
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
    let toStage: BoardStage | null = null;
    const overStr = String(overId);
    if ((BOARD_STAGES as readonly string[]).includes(overStr)) {
      toStage = overStr as BoardStage;
    } else {
      toStage = findStageForJob(overStr);
    }

    if (!fromStage || !toStage || fromStage === toStage) {
      setLiveMessage(t('announceCancelled'));
      return;
    }

    moveMutation.mutate({ jobId, fromStage, toStage });
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
