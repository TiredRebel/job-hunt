'use client';

/**
 * @module components/shell/topbar
 *
 * Dashboard topbar: page title, global search (⌘K) trigger, locale switch,
 * theme toggle. docs/UI_DESIGN.md §4.
 */
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';

import { usePathname } from '@/i18n/navigation';
import { DesignModeToggle } from '@/components/design-mode-toggle';
import { LocaleSwitch } from '@/components/locale-switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { listJobs } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';

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
export interface TopbarProps {
  readonly sidebarCollapsed: boolean;
  readonly onToggleSidebar: () => void;
}

/** Render the dashboard topbar and sidebar toggle. */
export function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const pathname = usePathname();
  const navT = useTranslations('nav');
  const paletteT = useTranslations('commandPalette');
  const { setOpen } = useCommandPalette();

  const labelKey = activeLabelKey(pathname);
  const isJobs = pathname === '/jobs' || pathname.startsWith('/jobs/');
  const jobsSummaryQuery = useQuery({
    queryKey: queryKeys.jobs.list({ limit: 1 }),
    queryFn: ({ signal }) => listJobs({ limit: 1 }, signal),
    enabled: isJobs,
    staleTime: 60 * 1000,
  });

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden min-[1025px]:inline-flex"
            aria-label={sidebarCollapsed ? paletteT('expandSidebar') : paletteT('collapseSidebar')}
            onClick={onToggleSidebar}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {sidebarCollapsed ? paletteT('expandSidebar') : paletteT('collapseSidebar')}
        </TooltipContent>
      </Tooltip>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-[-0.025em] text-text-primary">
          {labelKey ? navT(labelKey) : ''}
        </h1>
        {isJobs && jobsSummaryQuery.data && (
          <p className="tabular-nums truncate text-xs text-text-muted">
            {paletteT('jobsSummary', {
              total: jobsSummaryQuery.data.total,
              unreviewed: jobsSummaryQuery.data.unreviewed,
            })}
          </p>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-9 justify-center gap-2 bg-surface text-text-muted sm:w-[280px] sm:justify-start"
          onClick={() => setOpen(true)}
        >
          <Search aria-hidden="true" size={14} />
          <span className="hidden sm:inline">{paletteT('trigger')}</span>
          <kbd className="ml-auto hidden rounded-[calc(var(--radius-control)-3px)] border border-border bg-surface-elevated px-1.5 text-[10px] text-text-muted sm:inline">
            ⌘K
          </kbd>
        </Button>
        <LocaleSwitch />
        <ThemeToggle />
        <DesignModeToggle />
      </div>
    </header>
  );
}
