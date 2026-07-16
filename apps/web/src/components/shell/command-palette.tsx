'use client';

/**
 * @module components/shell/command-palette
 *
 * Global ⌘K / Ctrl+K command palette: navigation to every dashboard section
 * plus a "search jobs" action that routes to `/jobs?query=…`.
 * docs/UI_DESIGN.md §4, openspec `web-app-shell` capability.
 */
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { NAV_ITEMS } from './nav-items';
import { useCommandPalette } from './command-palette-context';

/**
 * Global command palette, toggled by ⌘K / Ctrl+K anywhere in the app (or the
 * topbar's search trigger, via {@link useCommandPalette}).
 *
 * @returns The command palette dialog (renders nothing visible when closed).
 */
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState('');
  const router = useRouter();
  const t = useTranslations('commandPalette');
  const navT = useTranslations('nav');

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  const runSearch = (): void => {
    const trimmed = query.trim();
    setOpen(false);
    router.push({ pathname: '/jobs', query: trimmed ? { query: trimmed } : {} });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('trigger')}
      description={t('placeholder')}
    >
      <CommandInput placeholder={t('placeholder')} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{t('empty')}</CommandEmpty>
        <CommandGroup heading={t('groupActions')}>
          <CommandItem value={`search-jobs-${query}`} onSelect={runSearch}>
            {t('searchJobs', { query: query.trim() || '…' })}
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading={t('groupNavigation')}>
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              value={navT(item.labelKey)}
              onSelect={() => {
                setOpen(false);
                router.push(item.href);
              }}
            >
              <item.icon aria-hidden="true" size={16} />
              {navT(item.labelKey)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
