'use client';

/**
 * @module components/jobs/job-detail
 *
 * Shared job-detail body for the drawer and `/jobs/[id]` full page
 * (job-detail spec "Job detail in drawer and full page"). Section order is
 * fixed per UI_DESIGN §5.3.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { Locale } from '@job-hunter/shared-ts';

import { CoverLetterEditor } from '@/components/jobs/cover-letter-editor';
import { ReactionTimeline } from '@/components/jobs/reaction-timeline';
import { ScoreBadge } from '@/components/score-badge';
import { StageBadge } from '@/components/stage-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import { deleteJob, getJob, type DeletedJobResponse, type JobDetail } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';
import { addReaction, type ReactionKind } from '@/lib/api/reactions';
import { useActiveProfile } from '@/lib/hooks/use-active-profile';
import { formatDate, formatPostedDate } from '@/lib/formatters';
import { useRouter } from '@/i18n/navigation';

const STAGE_OPTIONS = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
const FOOTER_STAGES = ['saved', 'applied', 'interview', 'rejected'] as const;

/** Props accepted by {@link JobDetailView}. */
export interface JobDetailViewProps {
  readonly jobId: string;
  readonly variant: 'drawer' | 'page';
  readonly onDirtyChange?: ((dirty: boolean) => void) | undefined;
  readonly onDeleted?: (() => void) | undefined;
}

/**
 * Resolve a localized footer-button label for a stage.
 *
 * @param t - Translator scoped to `jobDetail`.
 * @param stage - Stage key.
 * @returns Localized label.
 */
function footerStageLabel(
  t: ReturnType<typeof useTranslations<'jobDetail'>>,
  stage: (typeof FOOTER_STAGES)[number],
): string {
  switch (stage) {
    case 'saved':
      return t('actionSave');
    case 'applied':
      return t('actionApplied');
    case 'interview':
      return t('actionInterview');
    case 'rejected':
      return t('actionReject');
    default: {
      const exhaustive: never = stage;
      return exhaustive;
    }
  }
}

/**
 * Job detail sections in the locked UI_DESIGN §5.3 order.
 *
 * @param props - Detail view props.
 * @returns The detail content.
 */
export function JobDetailView({ jobId, variant, onDirtyChange, onDeleted }: JobDetailViewProps) {
  const t = useTranslations('jobDetail');
  const tJobs = useTranslations('jobs');
  const tStages = useTranslations('stages');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const router = useRouter();
  const activeProfile = useActiveProfile();
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const profileId = activeProfile.data ? String(activeProfile.data.id) : null;
  const drawerActionClass = variant === 'drawer' ? 'w-full' : undefined;

  const jobQuery = useQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: ({ signal }) => getJob(jobId, signal),
  });

  const invalidateRelated = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) }),
      activeProfile.data
        ? queryClient.invalidateQueries({
            queryKey: queryKeys.reactions.timeline(jobId, String(activeProfile.data.id)),
          })
        : Promise.resolve(),
    ]);
  }, [activeProfile.data, jobId, queryClient]);

  const stageMutation = useMutation({
    mutationFn: (reaction: ReactionKind) => {
      const profileId = activeProfile.data?.id;
      if (!profileId) {
        throw new Error('No active profile');
      }
      return addReaction({ jobId, profileId: String(profileId), reaction });
    },
    onMutate: async (reaction) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previous = queryClient.getQueryData<JobDetail>(queryKeys.jobs.detail(jobId));
      if (previous) {
        queryClient.setQueryData<JobDetail>(queryKeys.jobs.detail(jobId), {
          ...previous,
          currentReaction: reaction,
        });
      }
      return { previous };
    },
    onError: (_error, _reaction, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previous);
      }
      toast.error(t('stageError'));
    },
    onSuccess: async () => {
      await invalidateRelated();
      toast.success(t('stageSuccess'));
    },
  });

  const deleteMutation = useMutation<DeletedJobResponse, Error, string>({
    mutationFn: () => deleteJob(jobId),
    onSuccess: (_result, title) => {
      queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      if (profileId) {
        queryClient.removeQueries({ queryKey: queryKeys.reactions.timeline(jobId, profileId) });
      }
      toast.success(tJobs('delete.success', { title }));
      if (onDeleted) {
        onDeleted();
      } else {
        router.replace('/jobs');
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError && error.status === 404
          ? tJobs('delete.notFound')
          : tJobs('delete.error'),
      );
    },
  });

  if (jobQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3 p-1">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return <p className="text-sm text-destructive">{t('loadError')}</p>;
  }

  const job = jobQuery.data;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {/* 1. Header */}
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-3 pr-14">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary">{job.title}</h2>
              {job.company && <p className="text-sm text-text-muted">{job.company}</p>}
            </div>
            <ScoreBadge score={job.matchScore} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              {job.sourceSlug}
              <ExternalLink aria-hidden="true" size={12} />
            </a>
            <span>·</span>
            <span className="tabular-nums">
              {t('posted')}: {formatPostedDate(job.postedAt, job.firstSeenAt, locale) ?? '—'}
            </span>
            <span>·</span>
            <span className="tabular-nums">
              {t('firstSeen')}: {formatDate(job.firstSeenAt, locale) ?? '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StageBadge stage={job.currentReaction} />
            <Select
              {...(job.currentReaction ? { value: job.currentReaction } : {})}
              onValueChange={(value) => stageMutation.mutate(value as ReactionKind)}
            >
              <SelectTrigger className="h-8 w-40" aria-label={t('stageSelect')}>
                <SelectValue placeholder={t('stageSelect')} />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {tStages(stage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <Separator />

        {/* 2. LLM summary + tags + red flags */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">{t('summary')}</h3>
          {job.summary ? (
            <p className="text-sm text-text-primary whitespace-pre-wrap">{job.summary}</p>
          ) : (
            <p className="text-sm text-text-muted">{t('summaryPlaceholder')}</p>
          )}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[calc(var(--radius-control)-2px)] bg-surface-elevated px-1.5 py-0.5 text-xs text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {job.redFlags.length > 0 && (
            <ul className="space-y-1 rounded-[var(--radius-control)] border border-border bg-warning/10 px-3 py-2">
              {job.redFlags.map((flag) => (
                <li key={flag} className="text-sm text-warning">
                  {flag}
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        {/* 3. Match explanation */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">{t('matchExplanation')}</h3>
          {job.matchExplanation ? (
            <p className="text-sm text-text-primary whitespace-pre-wrap">{job.matchExplanation}</p>
          ) : (
            <p className="text-sm text-text-muted">{t('matchPlaceholder')}</p>
          )}
        </section>

        <Separator />

        {/* 4. Description */}
        <section className="space-y-2">
          <button
            type="button"
            className="text-sm font-semibold text-text-primary hover:text-accent"
            onClick={() => setDescriptionOpen((open) => !open)}
            aria-expanded={descriptionOpen}
          >
            {t('description')} {descriptionOpen ? '▾' : '▸'}
          </button>
          {descriptionOpen &&
            (job.descriptionMd ? (
              <div className="prose prose-sm max-w-none text-text-primary whitespace-pre-wrap">
                {job.descriptionMd}
              </div>
            ) : (
              <p className="text-sm text-text-muted">{t('descriptionPlaceholder')}</p>
            ))}
        </section>

        <Separator />

        {/* 5. Reaction timeline */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">{t('timeline')}</h3>
          {profileId ? (
            <ReactionTimeline jobId={jobId} profileId={profileId} />
          ) : (
            <p className="text-sm text-text-muted">{t('timelineNoProfile')}</p>
          )}
        </section>

        <Separator />

        {/* 6. Cover letter */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">{t('coverLetter')}</h3>
          <CoverLetterEditor
            key={jobId}
            jobId={jobId}
            hasMatch={job.matchScore !== null}
            {...(onDirtyChange ? { onDirtyChange } : {})}
          />
        </section>
      </div>

      {/* Footer actions (pinned in drawer; also shown on full page) */}
      <footer
        className={
          variant === 'drawer'
            ? 'mt-4 grid shrink-0 grid-cols-2 gap-2 border-t border-border pt-3 min-[480px]:grid-cols-3'
            : 'mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4'
        }
      >
        {FOOTER_STAGES.map((stage) => (
          <Button
            key={stage}
            type="button"
            size="sm"
            variant={stage === 'rejected' ? 'outline' : stage === 'applied' ? 'default' : 'outline'}
            disabled={stageMutation.isPending}
            onClick={() => stageMutation.mutate(stage)}
            className={drawerActionClass}
          >
            {footerStageLabel(t, stage)}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" asChild className={drawerActionClass}>
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            {tCommon('openOriginal')}
          </a>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={deleteMutation.isPending}
          className={drawerActionClass}
          onClick={() => {
            if (window.confirm(tJobs('delete.confirm', { title: job.title }))) {
              deleteMutation.mutate(job.title);
            }
          }}
        >
          <Trash2 aria-hidden="true" size={14} />
          {tJobs('delete.action')}
        </Button>
      </footer>
    </div>
  );
}
