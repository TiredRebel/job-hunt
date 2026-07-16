'use client';

/**
 * @module components/shell/sidebar
 *
 * Dashboard sidebar: 232px expanded, collapses to a 56px icon rail below the
 * 1280px (`xl`) breakpoint. Docs/UI_DESIGN.md §4.
 */
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { NAV_ITEMS } from './nav-items';

/**
 * Dashboard sidebar navigation rail.
 *
 * @returns The sidebar element.
 */
export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const appT = useTranslations('app');

  return (
    <aside className="flex h-full w-14 shrink-0 flex-col border-r border-border bg-surface xl:w-[232px]">
      <div className="flex h-12 items-center border-b border-border px-3">
        <span className="hidden truncate text-sm font-semibold text-text-primary xl:inline">
          {appT('name')}
        </span>
        <span className="text-sm font-semibold text-accent xl:hidden" aria-hidden="true">
          JH
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label={appT('name')}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = t(item.labelKey);
          const Icon = item.icon;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-[var(--radius-control)] px-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary',
                    active && 'bg-accent/10 text-accent',
                  )}
                >
                  <Icon aria-hidden="true" size={18} className="shrink-0" />
                  <span className="hidden truncate xl:inline">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="xl:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
