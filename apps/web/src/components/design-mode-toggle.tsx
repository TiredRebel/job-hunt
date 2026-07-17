'use client';

import { LayoutPanelTop, Shapes } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type DesignMode = 'fresh' | 'material';

const DESIGN_MODE_KEY = 'job-hunter-design-mode';

const DESIGN_OPTIONS = [
  { value: 'fresh', Icon: LayoutPanelTop },
  { value: 'material', Icon: Shapes },
] as const;

/** Switch between the Fieldwork visual system and Material 3 tokens. */
export function DesignModeToggle() {
  const t = useTranslations('design');
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
      suppressHydrationWarning
      className="inline-flex items-center gap-0.5 rounded-[var(--radius-control)] border border-border bg-surface p-0.5"
    >
      {DESIGN_OPTIONS.map(({ value, Icon }) => {
        const selected = mode === value;
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
              'flex h-7 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-2 text-xs font-medium text-text-muted transition-colors',
              selected && 'bg-accent text-accent-foreground',
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
