'use client';

/**
 * @module components/jobs/reaction-timeline
 *
 * Reaction event log for a job (job-detail spec "Reaction timeline"):
 * monospace timestamps formatted in the active locale, newest events first.
 */
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';

import { StageBadge } from '@/components/stage-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/api/query-keys';
import { getReactionTimeline } from '@/lib/api/reactions';
import { formatDateTime } from '@/lib/formatters';
import type { Locale } from '@job-hunter/shared-ts';

/** Props accepted by {@link ReactionTimeline}. */
export interface ReactionTimelineProps {
  readonly jobId: string;
  readonly profileId: string;
}

/**
 * Reaction timeline for a job/profile pair.
 *
 * @param props - Timeline props.
 * @returns The timeline element.
 */
export function ReactionTimeline({ jobId, profileId }: ReactionTimelineProps) {
  const t = useTranslations('jobDetail');
  const locale = useLocale() as Locale;

  const timelineQuery = useQuery({
    queryKey: queryKeys.reactions.timeline(jobId, profileId),
    queryFn: ({ signal }) => getReactionTimeline(jobId, profileId, signal),
  });

  if (timelineQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  const events = timelineQuery.data ?? [];
  if (events.length === 0) {
    return <p className="text-sm text-text-muted">{t('timelineEmpty')}</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3 text-sm">
          <time
            dateTime={event.occurredAt}
            className="tabular-nums shrink-0 font-mono text-xs text-text-muted"
          >
            {formatDateTime(event.occurredAt, locale)}
          </time>
          <div className="flex min-w-0 flex-col gap-1">
            <StageBadge stage={event.reaction} />
            {event.note && <p className="text-xs text-text-muted">{event.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
