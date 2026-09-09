'use client';

/**
 * @module components/jobs/score-meter
 *
 * Compact score track + numeric per docs/jobs-redesign.md §3.2.
 * Unscored jobs render a dashed track and "—", never "0".
 */
import { cn } from '@/lib/utils';

/** Props for {@link ScoreMeter}. */
export interface ScoreMeterProps {
  readonly score: number | null;
  readonly className?: string;
}

/**
 * Resolve fill color token for a scored band.
 *
 * @param score - Score 1–100.
 * @returns CSS color using semantic tokens.
 */
function fillFor(score: number): string {
  if (score >= 70) {
    return 'var(--accent)';
  }
  if (score >= 40) {
    return 'var(--accent-muted)';
  }
  return 'var(--state-rejected)';
}

/**
 * Score meter: 32px track, 4px tall, mono numeric.
 *
 * @param props - Score meter props.
 * @returns The meter element.
 */
export function ScoreMeter({ score, className }: ScoreMeterProps) {
  if (score === null) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5', className)}
        aria-label="Score unscored"
      >
        <span
          className="inline-block h-1 w-8 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] bg-transparent"
          aria-hidden="true"
        />
        <span className="tabular-nums text-xs text-[var(--text-secondary)]">—</span>
      </span>
    );
  }

  if (score === 0) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5', className)}
        aria-label="Score 0 of 100"
      >
        <span
          className="inline-block h-1 w-8 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)]"
          aria-hidden="true"
        />
        <span className="tabular-nums text-xs text-[var(--text-secondary)]">0</span>
      </span>
    );
  }

  const clamped = Math.max(0, Math.min(100, score));

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Score ${clamped} of 100`}
    >
      <span
        className="relative inline-block h-1 w-8 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-sunken)]"
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-[var(--radius-sm)]"
          style={{ width: `${clamped}%`, background: fillFor(clamped) }}
        />
      </span>
      <span className="tabular-nums text-xs text-[var(--text-mono)]">{clamped}</span>
    </span>
  );
}
