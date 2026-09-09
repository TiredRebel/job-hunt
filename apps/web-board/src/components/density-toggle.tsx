'use client';

/**
 * @module components/density-toggle
 *
 * Compact / comfortable density toggle. Writes only `data-density` on <html>
 * (and localStorage); components must consume `--density-*` tokens, never
 * branch on density in JS (docs/jobs-redesign.md §5 / §7).
 */
import { Rows2, Rows3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

export type DensityMode = 'compact' | 'comfortable';

const DENSITY_KEY = 'job-hunter-density';

const DENSITY_OPTIONS = [
  { value: 'compact', Icon: Rows3 },
  { value: 'comfortable', Icon: Rows2 },
] as const;

const subscribeToHydration = (): (() => void) => () => undefined;
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * Read persisted density; default compact.
 *
 * @returns The active density mode.
 */
function readDensity(): DensityMode {
  if (typeof window === 'undefined') {
    return 'compact';
  }
  return window.localStorage.getItem(DENSITY_KEY) === 'comfortable' ? 'comfortable' : 'compact';
}

/**
 * Header control for list/board density.
 *
 * @returns The density toggle.
 */
export function DensityToggle() {
  const t = useTranslations('density');
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const [density, setDensity] = useState<DensityMode>(readDensity);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    window.localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  return (
    <div
      role="radiogroup"
      aria-label={t('toggle')}
      className="inline-flex items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface)] p-0.5"
    >
      {DENSITY_OPTIONS.map(({ value, Icon }) => {
        const selected = hydrated && density === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => setDensity(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-colors',
              selected && 'bg-[var(--accent)] text-[var(--accent-fg)]',
            )}
          >
            <Icon aria-hidden="true" size={14} />
          </button>
        );
      })}
    </div>
  );
}
