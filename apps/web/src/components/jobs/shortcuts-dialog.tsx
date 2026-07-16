'use client';

/**
 * @module components/jobs/shortcuts-dialog
 *
 * `?` help dialog listing the jobs table's keyboard shortcuts
 * (jobs-dashboard spec "Keyboard-first row flow").
 */
import { useTranslations } from 'next-intl';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const SHORTCUT_KEYS = ['j', 'k', 'x', 'Enter', 'a', 'r', '/'] as const;

const LABEL_KEY_BY_SHORTCUT = {
  j: 'shortcuts.moveDown',
  k: 'shortcuts.moveUp',
  x: 'shortcuts.toggleSelect',
  Enter: 'shortcuts.open',
  a: 'shortcuts.markApplied',
  r: 'shortcuts.reject',
  '/': 'shortcuts.focusSearch',
} as const;

/** Props accepted by {@link ShortcutsDialog}. */
export interface ShortcutsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * Keyboard-shortcuts help dialog.
 *
 * @param props - Shortcuts dialog props.
 * @returns The dialog element.
 */
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const t = useTranslations('jobs');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('shortcuts.title')}</DialogTitle>
        <dl className="flex flex-col gap-2">
          {SHORTCUT_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-text-muted">{t(LABEL_KEY_BY_SHORTCUT[key])}</dt>
              <dd>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-text-primary">
                  {key}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
