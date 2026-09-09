'use client';

/**
 * @module components/shell/sidebar
 *
 * Dashboard sidebar: 248px expanded, collapses to a 64px icon rail below the
 * 1280px (`xl`) breakpoint. Docs/UI_DESIGN.md §2.3/§4.
 */
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { listJobs } from '@/lib/api/jobs';
import { getSourceRuns, listSources, type ScrapeRun, type Source } from '@/lib/api/sources';
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
function useNavData(): {
  readonly counts: Partial<Record<string, number>>;
  readonly sources: readonly Source[] | undefined;
} {
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
    counts: {
      '/jobs': jobsQuery.data?.total,
      '/board': boardQuery.data?.total,
      '/sources': sourcesQuery.data?.length,
    },
    sources: sourcesQuery.data,
  };
}

/** Latest run paired with its source. */
interface LatestSourceRun {
  readonly source: Source;
  readonly run: ScrapeRun;
}

/** Props accepted by {@link Sidebar}. */
export interface SidebarProps {
  readonly collapsed?: boolean;
}

/**
 * Dashboard sidebar navigation rail.
 *
 * @returns The sidebar element.
 */
export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const appT = useTranslations('app');
  const { counts: navCounts, sources } = useNavData();

  const latestRunQuery = useQuery({
    queryKey: ['sources', 'latest-run', sources?.map((source) => source.slug) ?? []],
    enabled: sources !== undefined && sources.length > 0,
    queryFn: async ({ signal }): Promise<LatestSourceRun | null> => {
      const runs = await Promise.all(
        (sources ?? []).map(async (source) => ({
          source,
          run: (await getSourceRuns(source.slug, { limit: 1, offset: 0 }, signal))[0],
        })),
      );
      return (
        runs
          .filter((value): value is LatestSourceRun => value.run !== undefined)
          .sort(
            (left, right) =>
              new Date(right.run.startedAt).getTime() - new Date(left.run.startedAt).getTime(),
          )[0] ?? null
      );
    },
    staleTime: 60 * 1000,
  });

  const latestRun = latestRunQuery.data;
  const latestInserted = latestRun
    ? typeof latestRun.run.stats['inserted'] === 'number'
      ? latestRun.run.stats['inserted']
      : typeof latestRun.run.stats['new'] === 'number'
        ? latestRun.run.stats['new']
        : 0
    : 0;
  const latestTime = latestRun
    ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
        new Date(latestRun.run.startedAt),
      )
    : null;
  const expandedClass = collapsed ? '' : 'min-[1025px]:w-[248px]';
  const expandedOnlyClass = collapsed ? 'hidden' : 'hidden min-[1025px]:block';
  const expandedInlineClass = collapsed ? 'hidden' : 'hidden min-[1025px]:inline';

  return (
    <aside
      className={`flex h-full w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-[var(--motion-base)] ${expandedClass}`}
    >
      <div className="flex h-14 items-center gap-3 px-3 min-[1025px]:px-4">
        <span className="size-2 shrink-0 rounded-[2px] bg-accent" aria-hidden="true" />
        <span
          className={`${expandedOnlyClass} min-w-0 truncate text-sm font-semibold tracking-[-0.02em]`}
        >
          {appT('name')}
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2 py-4" aria-label={appT('name')}>
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
                    'relative flex h-9 items-center gap-3 rounded-[var(--radius-control)] px-2.5 text-[13px] font-normal text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground',
                    active && 'bg-sidebar-active font-medium text-sidebar-foreground',
                  )}
                >
                  <Icon aria-hidden="true" size={18} className="shrink-0" />
                  <span className={`${expandedInlineClass} truncate`}>{label}</span>
                  {count !== undefined && (
                    <span
                      className={`tabular-nums ml-auto text-[11px] opacity-70 ${expandedInlineClass}`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className={collapsed ? undefined : 'min-[1025px]:hidden'}
              >
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className={`${expandedOnlyClass} border-t border-sidebar-border p-4`}>
        <p className="utility-label text-sidebar-muted">{appT('lastRun')}</p>
        <p className="tabular-nums mt-1 truncate text-xs text-sidebar-muted">
          {latestRun && latestTime
            ? appT('lastRunValue', {
                source: latestRun.source.slug,
                time: latestTime,
                count: latestInserted,
              })
            : appT('lastRunEmpty')}
        </p>
      </div>
    </aside>
  );
}
