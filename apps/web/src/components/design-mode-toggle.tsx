'use client';

/**
 * @module components/design-mode-toggle
 *
 * Two-state design-system toggle (Fieldwork / Material 3 token axis) for the
 * topbar, per docs/UI_DESIGN.md §3. Persists to localStorage and stamps
 * `data-design` on the root element; selection renders only after hydration
 * (same gate as `ThemeToggle`) so server and client markup always match.
 */
import { LayoutPanelTop, Shapes } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

type DesignMode = 'fresh' | 'material';

const DESIGN_MODE_KEY = 'job-hunter-design-mode';

const DESIGN_OPTIONS = [
  { value: 'fresh', Icon: LayoutPanelTop },
  { value: 'material', Icon: Shapes },
] as const;

const subscribeToHydration = (): (() => void) => () => undefined;
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * Switch between the Fieldwork visual system and Material 3 tokens.
 *
 * @returns The design-mode toggle control.
 */
export function DesignModeToggle() {
  const t = useTranslations('design');
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const [mode, setMode] = useState<DesignMode>(() => {
    if (typeof window === 'undefined') {
      return 'fresh';
    }
    return window.localStorage.getItem(DESIGN_MODE_KEY) === 'material' ? 'material' : 'fresh';
  });

  useEffect(() => {
    document.documentElement.dataset.design = mode;
    window.localStorage.setItem(DESIGN_MODE_KEY, mode);
  }, [mode]);

  const applyMode = (next: DesignMode): void => {
    setMode(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('toggle')}
      className="inline-flex items-center gap-0.5 rounded-[var(--radius-control)] border border-border bg-surface p-0.5"
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
            onClick={() => applyMode(value)}
            className={cn(
              // Settings, not actions — the selected state is carried by a
              // neutral fill plus a text-muted outline (>= 3:1 against the
              // group background in every theme), keeping the accent budget
              // for the things that act (docs/UI_DESIGN.md §2.1).
              'flex h-7 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] border border-transparent px-2 text-xs font-medium text-text-muted transition-colors',
              selected && 'border-text-muted bg-surface-tonal font-semibold text-text-primary',
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
