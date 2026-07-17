'use client';

/**
 * @module components/theme-toggle
 *
 * Three-state (light/dark/system) theme toggle for the sidebar footer, per
 * docs/UI_DESIGN.md §3.
 */
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

const THEME_OPTIONS = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
] as const;

const subscribeToHydration = (): (() => void) => () => undefined;
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * Segmented light/dark/system theme control.
 *
 * @returns The theme toggle control.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('theme');
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);

  return (
    <div
      role="radiogroup"
      aria-label={t('toggle')}
      className="inline-flex items-center gap-0.5 rounded-[var(--radius-control)] border border-border bg-surface p-0.5"
    >
      {THEME_OPTIONS.map(({ value, Icon }) => {
        const selected = hydrated && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-[calc(var(--radius-control)-2px)] text-text-muted transition-colors',
              selected && 'bg-accent text-accent-foreground',
            )}
          >
            <Icon aria-hidden="true" size={14} />
          </button>
        );
      })}
    </div>
  );
}
