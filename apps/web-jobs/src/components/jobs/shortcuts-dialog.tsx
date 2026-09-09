'use client';

/**
 * @module components/jobs/shortcuts-dialog
 *
 * Shortcut sheet grouped Navigate / Triage / View (docs/jobs-redesign.md §2.2).
 */
import { useTranslations } from 'next-intl';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

/** One shortcut group, in display order. */
const SHORTCUT_GROUPS = [
  {
    groupKey: 'shortcuts.groupTable',
    entries: [
      { key: 'J / K', labelKey: 'shortcuts.moveDown' },
      { key: 'Space', labelKey: 'shortcuts.toggleSelect' },
      { key: 'Enter / F', labelKey: 'shortcuts.focusMode' },
      { key: 'D', labelKey: 'shortcuts.detail' },
      { key: '/', labelKey: 'shortcuts.focusSearch' },
    ],
  },
  {
    groupKey: 'shortcuts.groupTriage',
    entries: [
      { key: 'S', labelKey: 'shortcuts.save' },
      { key: 'A', labelKey: 'shortcuts.markApplied' },
      { key: 'I', labelKey: 'shortcuts.interview' },
      { key: 'O', labelKey: 'shortcuts.offer' },
      { key: 'X', labelKey: 'shortcuts.reject' },
      { key: 'H', labelKey: 'shortcuts.hide' },
      { key: 'U', labelKey: 'shortcuts.undo' },
    ],
  },
  {
    groupKey: 'shortcuts.groupGlobal',
    entries: [
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
        <div className="flex flex-col gap-3.5">
          {SHORTCUT_GROUPS.map((group, index) => (
            <div key={group.groupKey} className="flex flex-col gap-1.5">
              {index > 0 && <Separator className="mb-1.5" />}
              <span className="utility-label text-[var(--text-secondary)]">
                {t(group.groupKey)}
              </span>
              <dl className="flex flex-col gap-2">
                {group.entries.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-[var(--text-secondary)]">{t(entry.labelKey)}</dt>
                    <dd>
                      <kbd className="min-w-11 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-1.5 py-0.5 text-center font-mono text-xs text-[var(--text-primary)]">
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
