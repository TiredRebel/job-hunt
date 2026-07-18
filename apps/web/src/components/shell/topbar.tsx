'use client';

/**
 * @module components/shell/topbar
 *
 * Dashboard topbar: page title, global search (⌘K) trigger, locale switch,
 * theme toggle. docs/UI_DESIGN.md §4.
 */
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { usePathname } from '@/i18n/navigation';
import { DesignModeToggle } from '@/components/design-mode-toggle';
import { LocaleSwitch } from '@/components/locale-switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

import { NAV_ITEMS } from './nav-items';
import { useCommandPalette } from './command-palette-context';

/**
 * Resolve the current page title from the matching nav item's label key.
 *
 * @param pathname - Locale-stripped current pathname.
 * @returns The nav label key for the active section, or `null` if none match.
 */
function activeLabelKey(pathname: string): (typeof NAV_ITEMS)[number]['labelKey'] | null {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.labelKey ?? null;
}

/**
 * Dashboard topbar.
 *
 * @returns The topbar element.
 */
export function Topbar() {
  const pathname = usePathname();
  const navT = useTranslations('nav');
  const appT = useTranslations('app');
  const paletteT = useTranslations('commandPalette');
  const { setOpen } = useCommandPalette();

  const labelKey = activeLabelKey(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 lg:px-5">
      <div className="min-w-0">
        <p className="utility-label truncate text-accent">{appT('workspace')}</p>
        <h1 className="mt-0.5 truncate text-base font-semibold tracking-[-0.025em] text-text-primary">
          {labelKey ? navT(labelKey) : ''}
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-9 justify-center gap-2 bg-surface text-text-muted shadow-[var(--shadow-panel)] sm:w-48 sm:justify-start"
          onClick={() => setOpen(true)}
        >
          <Search aria-hidden="true" size={14} />
          <span className="hidden sm:inline">{paletteT('trigger')}</span>
          <kbd className="ml-auto hidden rounded-[calc(var(--radius-control)-3px)] border border-border bg-surface-elevated px-1.5 text-[10px] text-text-muted sm:inline">
            ⌘K
          </kbd>
        </Button>
        <DesignModeToggle />
        <LocaleSwitch />
        <ThemeToggle />
      </div>
    </header>
  );
}
