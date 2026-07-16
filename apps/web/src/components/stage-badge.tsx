'use client';

/**
 * @module components/stage-badge
 *
 * Reaction-stage badge (docs/UI_DESIGN.md §2.1). The five canonical board
 * stages (`saved`/`applied`/`interview`/`offer`/`rejected`) each own a
 * design token; the remaining API reaction kinds
 * (`viewed_by_employer`/`replied`/`test_task`/`withdrawn`) are grouped onto
 * the closest canonical color (applied/applied/interview/rejected
 * respectively) since UI_DESIGN only specifies five stage colors.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** Canonical stage color families defined in `globals.css`. */
type StageColor = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

const COLOR_BY_REACTION: Record<string, StageColor> = {
  saved: 'saved',
  applied: 'applied',
  viewed_by_employer: 'applied',
  replied: 'applied',
  interview: 'interview',
  test_task: 'interview',
  offer: 'offer',
  rejected: 'rejected',
  withdrawn: 'rejected',
};

const COLOR_CLASSES: Record<StageColor, string> = {
  saved: 'bg-stage-saved-bg text-stage-saved-fg',
  applied: 'bg-stage-applied-bg text-stage-applied-fg',
  interview: 'bg-stage-interview-bg text-stage-interview-fg',
  offer: 'bg-stage-offer-bg text-stage-offer-fg',
  rejected: 'bg-stage-rejected-bg text-stage-rejected-fg',
};

/** Props accepted by {@link StageBadge}. */
export interface StageBadgeProps {
  readonly stage: string | null;
  readonly className?: string;
}

/**
 * Reaction-stage badge. Renders a localized "no reaction yet" placeholder
 * when `stage` is `null`.
 *
 * @param props - Stage badge props.
 * @returns The badge element.
 */
export function StageBadge({ stage, className }: StageBadgeProps) {
  const t = useTranslations('stages');

  if (stage === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-[calc(var(--radius-control)-2px)] bg-stage-saved-bg px-1.5 py-0.5 text-xs text-stage-saved-fg',
          className,
        )}
      >
        {t('none')}
      </span>
    );
  }

  const color = COLOR_BY_REACTION[stage] ?? 'saved';
  const label = stage in COLOR_BY_REACTION ? t(stage as keyof typeof COLOR_BY_REACTION) : stage;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[calc(var(--radius-control)-2px)] px-1.5 py-0.5 text-xs font-medium',
        COLOR_CLASSES[color],
        className,
      )}
    >
      {label}
    </span>
  );
}
