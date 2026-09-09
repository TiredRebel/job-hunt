'use client';

/**
 * @module components/jobs/job-row-actions
 *
 * Hover/focus-revealed ⋯ menu for a job row (docs/jobs-redesign.md §3.1).
 */
import { Copy, EyeOff, MoreHorizontal, Trash2, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Props for {@link JobRowActions}. */
export interface JobRowActionsProps {
  readonly title: string;
  readonly sourceUrl: string | null;
  readonly onCopyLink: () => void;
  readonly onHide: () => void;
  readonly onDelete: () => void;
}

/**
 * Row overflow menu: open source, copy link, hide, delete.
 *
 * @param props - Action callbacks.
 * @returns The menu trigger + content.
 */
export function JobRowActions({
  title,
  sourceUrl,
  onCopyLink,
  onHide,
  onDelete,
}: JobRowActionsProps) {
  const t = useTranslations('jobs.rowActions');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
          aria-label={t('menu', { title })}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal aria-hidden="true" size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        {sourceUrl && (
          <DropdownMenuItem asChild>
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              <ArrowUpRight aria-hidden="true" size={14} />
              {t('openSource')}
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => {
            onCopyLink();
          }}
        >
          <Copy aria-hidden="true" size={14} />
          {t('copyLink')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onHide}>
          <EyeOff aria-hidden="true" size={14} />
          {t('hide')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[var(--state-rejected-fg)]" onSelect={onDelete}>
          <Trash2 aria-hidden="true" size={14} />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
