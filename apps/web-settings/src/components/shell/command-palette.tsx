'use client';

/**
 * @module components/shell/command-palette
 *
 * Global ⌘K / Ctrl+K command palette: live vacancy search (server-side,
 * debounced), quick actions ("run source now" per enabled source, plus the
 * full-list search redirect), and navigation to every dashboard section.
 * docs/UI_DESIGN.md §4, design_handoff jobs-states "command palette" state.
 *
 * `shouldFilter={false}` on the underlying `Command` (see `ui/command.tsx`)
 * hands filtering to us: vacancy results already come pre-filtered from the
 * server, and the static nav/action rows are filtered here by the same
 * typed query so cmdk never re-filters (and hides) server results by an
 * unrelated fuzzy match.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScoreBadge } from '@/components/score-badge';
import { listJobs } from '@/lib/api/jobs';
import { listSources, triggerScrape } from '@/lib/api/sources';
import { queryKeys } from '@/lib/api/query-keys';

import { NAV_ITEMS } from './nav-items';
import { useCommandPalette } from './command-palette-context';

/** Debounce delay before a typed query hits the jobs search endpoint. */
const SEARCH_DEBOUNCE_MS = 250;
/** Minimum query length before searching vacancies (avoids 1-char noise). */
const MIN_QUERY_LENGTH = 2;
/** Vacancy results shown inline — deep results still reachable via "search all". */
const RESULT_LIMIT = 5;

/**
 * Debounce a fast-changing value.
 *
 * @param value - Value to debounce.
 * @param delayMs - Delay in milliseconds.
 * @returns The debounced value.
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Global command palette, toggled by ⌘K / Ctrl+K anywhere in the app (or the
 * topbar's search trigger, via {@link useCommandPalette}).
 *
 * @returns The command palette dialog (renders nothing visible when closed).
 */
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const router = useRouter();
  const t = useTranslations('commandPalette');
  const navT = useTranslations('nav');
  const sourcesT = useTranslations('sources');

  const searchEnabled = open && debouncedQuery.length >= MIN_QUERY_LENGTH;
  const jobsSearch = useQuery({
    queryKey: queryKeys.jobs.list({ query: debouncedQuery, limit: RESULT_LIMIT }),
    queryFn: ({ signal }) => listJobs({ query: debouncedQuery, limit: RESULT_LIMIT }, signal),
    enabled: searchEnabled,
    staleTime: 30 * 1000,
  });

  const sourcesQuery = useQuery({
    queryKey: queryKeys.sources.all,
    queryFn: ({ signal }) => listSources(signal),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const runSourceMutation = useMutation({
    mutationFn: (slug: string) => triggerScrape(slug),
    onSuccess: () => toast.success(sourcesT('scrapeAccepted')),
    onError: () => toast.error(sourcesT('scrapeError')),
  });

  const runSearch = (): void => {
    const trimmed = query.trim();
    setOpen(false);
    router.push({ pathname: '/jobs', query: trimmed ? { query: trimmed } : {} });
  };

  const lowerQuery = query.trim().toLowerCase();
  const matchesQuery = (label: string): boolean =>
    lowerQuery.length === 0 || label.toLowerCase().includes(lowerQuery);

  const navItems = NAV_ITEMS.filter((item) => matchesQuery(navT(item.labelKey)));
  const runnableSources = (sourcesQuery.data ?? []).filter(
    (source) => source.enabled && matchesQuery(source.name),
  );
  const jobResults = searchEnabled ? (jobsSearch.data?.items ?? []) : [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('trigger')}
      description={t('placeholder')}
    >
      <CommandInput placeholder={t('placeholder')} value={query} onValueChange={setQuery} />
      <CommandList>
        {jobResults.length === 0 && navItems.length === 0 && runnableSources.length === 0 && (
          <CommandEmpty>{t('empty')}</CommandEmpty>
        )}

        {jobResults.length > 0 && (
          <CommandGroup heading={t('groupVacancies', { count: jobResults.length })}>
            {jobResults.map((job) => (
              <CommandItem
                key={job.id}
                value={`job-${job.id}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/jobs/${job.id}`);
                }}
              >
                <ScoreBadge score={job.matchScore} />
                <span className="truncate">{job.title}</span>
                <span className="ml-auto truncate text-xs text-text-muted">{job.company}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading={t('groupActions')}>
          <CommandItem value={`search-jobs-${query}`} onSelect={runSearch}>
            {t('searchJobs', { query: query.trim() || '…' })}
          </CommandItem>
          {runnableSources.map((source) => (
            <CommandItem
              key={source.slug}
              value={`run-source-${source.slug}`}
              disabled={runSourceMutation.isPending}
              onSelect={() => {
                setOpen(false);
                runSourceMutation.mutate(source.slug);
              }}
            >
              {t('runSourceNow', { name: source.name })}
            </CommandItem>
          ))}
        </CommandGroup>

        {navItems.length > 0 && (
          <CommandGroup heading={t('groupNavigation')}>
            {navItems.map((item) => (
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
        )}
      </CommandList>
    </CommandDialog>
  );
}
