'use client';

/**
 * @module components/stage-badge
 *
 * Reaction-stage badge + inline picker (docs/jobs-redesign.md §3.3).
 * Outlined vs tonal fill is expressed via `--chip-border-width` / theme
 * rules — never a JS branch on theme.
 */
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Canonical board stages for the picker. */
export const STAGE_PICKER_OPTIONS = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;

/** Canonical stage color families. */
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

/**
 * Resolve stage color CSS classes for callers that need a tint without the badge.
 *
 * @param stage - Reaction/board stage, or `null`.
 * @returns Utility classes for that stage's color.
 */
export function stageColorClasses(stage: string | null): string {
  const color = stage === null ? 'saved' : (COLOR_BY_REACTION[stage] ?? 'saved');
  return `bg-stage-${color}-bg text-stage-${color}-fg`;
}

/** Props for {@link StageBadge}. */
export interface StageBadgeProps {
  readonly stage: string | null;
  readonly className?: string;
  /** When set, clicking opens an inline stage picker. */
  readonly onStageChange?: (stage: (typeof STAGE_PICKER_OPTIONS)[number]) => void;
  readonly disabled?: boolean;
}

/**
 * Stage badge; optionally a menu trigger for inline staging.
 *
 * @param props - Stage badge props.
 * @returns The badge element.
 */
export function StageBadge({ stage, className, onStageChange, disabled }: StageBadgeProps) {
  const t = useTranslations('stages');

  const colorKey = stage === null ? null : (COLOR_BY_REACTION[stage] ?? 'saved');
  const label =
    stage === null
      ? t('none')
      : stage in COLOR_BY_REACTION
        ? t(stage as keyof typeof COLOR_BY_REACTION)
        : stage;

  const toneClass =
    colorKey === null
      ? 'text-[var(--text-secondary)] border-[var(--border-strong)] bg-transparent [[data-theme=material]_&]:bg-[var(--surface-sunken)]'
      : {
          saved:
            'text-[var(--state-saved-fg)] border-[var(--state-saved)] bg-transparent [[data-theme=material]_&]:bg-[var(--state-saved-muted)]',
          applied:
            'text-[var(--state-applied-fg)] border-[var(--state-applied)] bg-transparent [[data-theme=material]_&]:bg-[var(--state-applied-muted)]',
          interview:
            'text-[var(--state-interview-fg)] border-[var(--state-interview)] bg-transparent [[data-theme=material]_&]:bg-[var(--state-interview-muted)]',
          offer:
            'text-[var(--state-offer-fg)] border-[var(--state-offer)] bg-transparent [[data-theme=material]_&]:bg-[var(--state-offer-muted)]',
          rejected:
            'text-[var(--state-rejected-fg)] border-[var(--state-rejected)] bg-transparent [[data-theme=material]_&]:bg-[var(--state-rejected-muted)]',
        }[colorKey];

  const solidBadge = (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 font-medium',
        'rounded-[var(--radius-pill)]',
        'border-[length:var(--chip-border-width)] border-solid',
        'text-[length:var(--label-size)] tracking-[var(--label-tracking)]',
        '[text-transform:var(--label-transform)]',
        onStageChange && !disabled && 'cursor-pointer',
        toneClass,
        className,
      )}
    >
      {label}
    </span>
  );

  if (!onStageChange || disabled) {
    return solidBadge;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-[var(--radius-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
        >
          {solidBadge}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(event) => event.stopPropagation()}>
        {STAGE_PICKER_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => onStageChange(option)}
            className={stage === option ? 'bg-[var(--accent-muted)]' : undefined}
          >
            {t(option)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
