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
  const paletteT = useTranslations('commandPalette');
  const { setOpen } = useCommandPalette();

  const labelKey = activeLabelKey(pathname);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <h1 className="truncate text-sm font-semibold text-text-primary">
        {labelKey ? navT(labelKey) : ''}
      </h1>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-text-muted"
          onClick={() => setOpen(true)}
        >
          <Search aria-hidden="true" size={14} />
          <span className="hidden sm:inline">{paletteT('trigger')}</span>
          <kbd className="hidden rounded border border-border bg-surface px-1 text-[10px] text-text-muted sm:inline">
            ⌘K
          </kbd>
        </Button>
        <LocaleSwitch />
        <ThemeToggle />
      </div>
    </header>
  );
}
