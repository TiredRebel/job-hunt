'use client';

/**
 * @module components/jobs/shortcuts-dialog
 *
 * `?` help dialog listing the jobs table's keyboard shortcuts
 * (jobs-dashboard spec "Keyboard-first row flow").
 */
import { useTranslations } from 'next-intl';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

/** One shortcut group, in display order. */
const SHORTCUT_GROUPS = [
  {
    groupKey: 'shortcuts.groupTable',
    entries: [
      { key: 'j / k', labelKey: 'shortcuts.moveDown' },
      { key: 'x', labelKey: 'shortcuts.toggleSelect' },
      { key: 'Enter', labelKey: 'shortcuts.open' },
      { key: '⌘/Ctrl Enter', labelKey: 'shortcuts.openFullPage' },
    ],
  },
  {
    groupKey: 'shortcuts.groupTriage',
    entries: [
      { key: 'a', labelKey: 'shortcuts.markApplied' },
      { key: 's', labelKey: 'shortcuts.save' },
      { key: 'r', labelKey: 'shortcuts.reject' },
    ],
  },
  {
    groupKey: 'shortcuts.groupGlobal',
    entries: [
      { key: '/', labelKey: 'shortcuts.focusSearch' },
      { key: '⌘K', labelKey: 'shortcuts.commandPalette' },
      { key: '?', labelKey: 'shortcuts.showHelp' },
    ],
  },
] as const;

/** Props accepted by {@link ShortcutsDialog}. */
export interface ShortcutsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * Keyboard-shortcuts help dialog, grouped by table / triage / global scope.
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
        <div className="flex flex-col gap-3.5">
          {SHORTCUT_GROUPS.map((group, index) => (
            <div key={group.groupKey} className="flex flex-col gap-1.5">
              {index > 0 && <Separator className="mb-1.5" />}
              <span className="utility-label text-text-muted">{t(group.groupKey)}</span>
              <dl className="flex flex-col gap-2">
                {group.entries.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-text-muted">{t(entry.labelKey)}</dt>
                    <dd>
                      <kbd className="min-w-11 rounded border border-border bg-surface px-1.5 py-0.5 text-center font-mono text-xs text-text-primary">
                        {entry.key}
                      </kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
