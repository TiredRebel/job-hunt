'use client';

/**
 * @module components/shell/sidebar
 *
 * Dashboard sidebar: 248px expanded, collapses to a 64px icon rail below the
 * 1280px (`xl`) breakpoint. Docs/UI_DESIGN.md §2.3/§4.
 */
import { useTranslations } from 'next-intl';
import { Radar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { listJobs } from '@/lib/api/jobs';
import { listSources } from '@/lib/api/sources';
import { queryKeys } from '@/lib/api/query-keys';

import { NAV_ITEMS } from './nav-items';

/** Reaction stages counted as "in motion" for the Board nav badge — every stage but Rejected. */
const IN_MOTION_REACTIONS = ['saved', 'applied', 'interview', 'offer'] as const;

/**
 * Per-nav-item counts (Jobs / Board / Sources — the three the mock badges).
 * Three cheap, independently-cached queries; each renders its badge only
 * once its own count resolves, so a slow one never blocks the others.
 *
 * @returns A `href -> count` lookup, missing entries while loading.
 */
function useNavCounts(): Partial<Record<string, number>> {
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs.list({ limit: 1 }),
    queryFn: ({ signal }) => listJobs({ limit: 1 }, signal),
    staleTime: 60 * 1000,
  });
  const boardQuery = useQuery({
    queryKey: queryKeys.jobs.list({ reaction: IN_MOTION_REACTIONS, limit: 1 }),
    queryFn: ({ signal }) => listJobs({ reaction: IN_MOTION_REACTIONS, limit: 1 }, signal),
    staleTime: 60 * 1000,
  });
  const sourcesQuery = useQuery({
    queryKey: queryKeys.sources.all,
    queryFn: ({ signal }) => listSources(signal),
    staleTime: 5 * 60 * 1000,
  });

  return {
    '/jobs': jobsQuery.data?.total,
    '/board': boardQuery.data?.total,
    '/sources': sourcesQuery.data?.length,
  };
}

/**
 * Dashboard sidebar navigation rail.
 *
 * @returns The sidebar element.
 */
export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const appT = useTranslations('app');
  const navCounts = useNavCounts();

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground xl:w-[248px]">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-3 xl:px-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[calc(var(--radius-card)-2px)] bg-accent text-accent-foreground shadow-sm">
          <Radar aria-hidden="true" size={19} strokeWidth={2.2} />
        </span>
        {/* Product name only — the "Opportunity OS" tagline was marketing copy
            on a tool that is explicitly not a marketing surface (§1). */}
        <span className="hidden min-w-0 truncate text-sm font-semibold tracking-[-0.02em] xl:block">
          {appT('name')}
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2 py-4" aria-label={appT('name')}>
        <p className="utility-label mb-2 hidden px-2.5 text-sidebar-muted xl:block">
          {appT('workspace')}
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = t(item.labelKey);
          const Icon = item.icon;
          const count = navCounts[item.href];
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  className={cn(
                    'relative flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground',
                    active &&
                      'bg-sidebar-active text-sidebar-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent',
                  )}
                >
                  <Icon aria-hidden="true" size={18} className="shrink-0" />
                  <span className="hidden truncate xl:inline">{label}</span>
                  {count !== undefined && (
                    <span className="tabular-nums ml-auto hidden text-xs opacity-70 xl:inline">
                      {count}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="xl:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className="hidden border-t border-sidebar-border p-4 xl:block">
        <div className="flex items-center gap-2 text-xs text-sidebar-muted">
          <span className="inline-flex size-2 rounded-full bg-accent" aria-hidden="true" />
          {appT('ready')}
        </div>
      </div>
    </aside>
  );
}
