'use client';

/**
 * @module components/jobs/bulk-action-bar
 *
 * Docked bulk actions — no confirm dialogs; callers own undo toasts
 * (docs/jobs-redesign.md §2.3).
 */
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STAGE_OPTIONS = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;

/** Props accepted by {@link BulkActionBar}. */
export interface BulkActionBarProps {
  readonly count: number;
  readonly onMarkApplied: () => void;
  readonly onSave: () => void;
  readonly onSetStage: (stage: (typeof STAGE_OPTIONS)[number]) => void;
  readonly onReject: () => void;
  readonly onHide: () => void;
  readonly onDelete: () => void;
  readonly onClear: () => void;
  readonly pending: boolean;
}

/**
 * Bottom bar summoned by row selection.
 *
 * @param props - Bulk action bar props.
 * @returns The action bar element, or `null` when nothing is selected.
 */
export function BulkActionBar({
  count,
  onMarkApplied,
  onSave,
  onSetStage,
  onReject,
  onHide,
  onDelete,
  onClear,
  pending,
}: BulkActionBarProps) {
  const t = useTranslations('jobs');
  const tStages = useTranslations('stages');

  if (count === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4">
      <div
        role="toolbar"
        aria-label={t('bulk.selected', { count })}
        className="pointer-events-auto flex h-14 max-w-full flex-wrap items-center gap-3 border border-b-0 border-[var(--border-strong)] bg-[var(--surface-overlay)] px-4 py-2.5 shadow-[var(--elevation-2)] rounded-t-[var(--radius-lg)]"
      >
        <span className="tabular-nums text-sm font-medium text-[var(--text-primary)]">
          {t('bulk.selected', { count })}
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={onMarkApplied}>
            {t('bulk.markApplied')}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onSave}>
            {t('bulk.save')}
          </Button>
          <Select onValueChange={(value) => onSetStage(value as (typeof STAGE_OPTIONS)[number])}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder={t('bulk.setStage')} />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {tStages(stage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onReject}>
            {t('bulk.reject')}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onHide}>
            {t('bulk.hide')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={onDelete}
            className="text-[var(--state-rejected-fg)]"
          >
            {t('bulk.delete')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="text-[var(--text-secondary)]"
          >
            {t('bulk.clear')}
          </Button>
        </div>
      </div>
    </div>
  );
}
