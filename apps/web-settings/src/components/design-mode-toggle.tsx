'use client';

/**
 * @module components/design-mode-toggle
 *
 * Fieldwork / Material theme axis. Persists to localStorage and stamps
 * `data-theme` on <html> (docs/jobs-redesign.md §7). Selection renders only
 * after hydration so SSR markup matches.
 */
import { LayoutPanelTop, Shapes } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

export type DesignTheme = 'fieldwork' | 'material';

const THEME_KEY = 'job-hunter-theme';
const LEGACY_KEY = 'job-hunter-design-mode';

const DESIGN_OPTIONS = [
  { value: 'fieldwork', Icon: LayoutPanelTop },
  { value: 'material', Icon: Shapes },
] as const;

const subscribeToHydration = (): (() => void) => () => undefined;
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * Read the persisted design theme, migrating the legacy `fresh` key.
 *
 * @returns The active design theme.
 */
function readTheme(): DesignTheme {
  if (typeof window === 'undefined') {
    return 'fieldwork';
  }
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'material' || stored === 'fieldwork') {
    return stored;
  }
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  return legacy === 'material' ? 'material' : 'fieldwork';
}

/**
 * Switch between Fieldwork and Material token maps.
 *
 * @returns The design-theme toggle control.
 */
export function DesignModeToggle() {
  const t = useTranslations('design');
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const [mode, setMode] = useState<DesignTheme>(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    window.localStorage.setItem(THEME_KEY, mode);
    window.localStorage.setItem(LEGACY_KEY, mode === 'material' ? 'material' : 'fresh');
  }, [mode]);

  return (
    <div
      role="radiogroup"
      aria-label={t('toggle')}
      className="inline-flex items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface)] p-0.5"
    >
      {DESIGN_OPTIONS.map(({ value, Icon }) => {
        const selected = hydrated && mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => setMode(value)}
            className={cn(
              'flex h-7 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-transparent px-2 text-xs font-medium text-[var(--text-secondary)] transition-colors',
              selected &&
                'border-[var(--border-strong)] bg-[var(--surface-sunken)] font-semibold text-[var(--text-primary)]',
            )}
          >
            <Icon aria-hidden="true" size={13} />
            <span className="hidden 2xl:inline">{t(value)}</span>
          </button>
        );
      })}
    </div>
  );
}
