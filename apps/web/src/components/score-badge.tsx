'use client';

/**
 * @module components/score-badge
 *
 * Semantic match-score badge (docs/UI_DESIGN.md §2.1): `>= 80` accent-green,
 * `60–79` lime/neutral, `40–59` amber, `< 40` muted gray. `null` renders a
 * localized "not scored" placeholder instead of a colored badge.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** Score tier, used to pick the token pair for {@link ScoreBadge}. */
type ScoreTier = 'high' | 'mid' | 'low' | 'poor';

/**
 * Resolve a match score into its semantic tier.
 *
 * @param score - Match score (0–100).
 * @returns The tier the score falls into.
 */
function tierFor(score: number): ScoreTier {
  if (score >= 80) {
    return 'high';
  }
  if (score >= 60) {
    return 'mid';
  }
  if (score >= 40) {
    return 'low';
  }
  return 'poor';
}

const TIER_CLASSES: Record<ScoreTier, string> = {
  high: 'bg-score-high-bg text-score-high-fg',
  mid: 'bg-score-mid-bg text-score-mid-fg',
  low: 'bg-score-low-bg text-score-low-fg',
  poor: 'bg-score-poor-bg text-score-poor-fg',
};

/** Props accepted by {@link ScoreBadge}. */
export interface ScoreBadgeProps {
  readonly score: number | null;
  readonly className?: string;
}

/**
 * Match-score badge with tabular-numeral monospace digits.
 *
 * @param props - Score badge props.
 * @returns The badge element.
 */
export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const t = useTranslations('jobs');

  if (score === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-[calc(var(--radius-control)-2px)] bg-score-poor-bg px-1.5 py-0.5 text-xs text-score-poor-fg',
          className,
        )}
      >
        {t('scoreUnscored')}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'tabular-nums inline-flex items-center rounded-[calc(var(--radius-control)-2px)] px-1.5 py-0.5 text-xs font-medium',
        TIER_CLASSES[tierFor(score)],
        className,
      )}
    >
      {score}
    </span>
  );
}
