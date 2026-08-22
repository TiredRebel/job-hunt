'use client';

/**
 * @module components/jobs/bulk-action-bar
 *
 * Bottom action bar for bulk stage changes (jobs-dashboard spec "Bulk stage
 * actions"). Destructive actions (Reject) require an inline confirm rather
 * than firing immediately.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

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
  readonly onDelete: () => void;
  readonly onClear: () => void;
  readonly pending: boolean;
}

/**
 * Bottom bar summoned by row selection, offering bulk stage actions.
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
  onDelete,
  onClear,
  pending,
}: BulkActionBarProps) {
  const t = useTranslations('jobs');
  const tStages = useTranslations('stages');
  const tCommon = useTranslations('common');
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (count === 0) {
    return null;
  }

  const handleRejectClick = (): void => {
    if (confirmingReject) {
      setConfirmingReject(false);
      onReject();
    } else {
      setConfirmingReject(true);
    }
  };

  const handleDeleteClick = (): void => {
    if (confirmingDelete) {
      setConfirmingDelete(false);
      onDelete();
    } else {
      setConfirmingDelete(true);
    }
  };

  return (
    <div
      role="toolbar"
      aria-label={t('bulk.selected', { count })}
      className="sticky bottom-0 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-t-[var(--radius-card)] border border-b-0 border-border bg-surface-elevated px-4 py-2.5 shadow-[var(--shadow-elevated)]"
    >
      <span className="tabular-nums text-sm font-medium text-text-primary">
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
        <Button
          type="button"
          size="sm"
          variant={confirmingReject ? 'destructive' : 'outline'}
          disabled={pending}
          onClick={handleRejectClick}
          onBlur={() => setConfirmingReject(false)}
        >
          {confirmingReject ? tCommon('confirm') : t('bulk.reject')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={confirmingDelete ? 'destructive' : 'outline'}
          disabled={pending}
          onClick={handleDeleteClick}
          onBlur={() => setConfirmingDelete(false)}
        >
          {confirmingDelete ? tCommon('confirm') : t('bulk.delete')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="text-text-muted"
        >
          {tCommon('cancel')}
        </Button>
      </div>
    </div>
  );
}
