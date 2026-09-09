'use client';

import { BookOpenText, Bot, Rss, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/settings/llm', key: 'llm', icon: Bot },
  { href: '/sources', key: 'sources', icon: Rss },
  { href: '/dictionaries', key: 'dictionaries', icon: BookOpenText },
  { href: '/profile', key: 'profile', icon: UserRound },
] as const;

/** Settings section navigation with current-route state. */
export function SettingsNav() {
  const t = useTranslations('settingsNav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('label')} className="flex gap-1 overflow-x-auto min-[1100px]:flex-col">
      {ITEMS.map(({ href, key, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm text-text-muted hover:bg-surface-elevated hover:text-text-primary',
              active && 'bg-surface-elevated font-medium text-text-primary',
            )}
          >
            <Icon aria-hidden="true" size={15} />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
