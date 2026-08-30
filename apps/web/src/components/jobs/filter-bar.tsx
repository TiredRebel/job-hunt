'use client';

/**
 * @module components/jobs/filter-bar
 *
 * Two-line filter chip bar + live advanced slide-over
 * (docs/jobs-redesign.md §4.1–§4.2). URL is the source of truth.
 */
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState, type RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useRouter, usePathname } from '@/i18n/navigation';
import type { DateField, JobsListParams, JobSortBy, SortDir } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';
import { listSources } from '@/lib/api/sources';
import type { DatePreset } from '@/lib/jobs/date-presets';
import { resolveDatePreset } from '@/lib/jobs/date-presets';
import { countActiveFilters, jobsListParamsToSearchParams } from '@/lib/jobs/search-params';
import { cn } from '@/lib/utils';

import { MultiSelect } from './multi-select';
import { TagsInput } from './tags-input';

/** A removable chip describing one active filter. */
export interface FilterChip {
  readonly id: string;
  readonly label: string;
  readonly onRemove: () => void;
}

const STAGE_VALUES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
const DATE_PRESETS: readonly DatePreset[] = ['today', '3d', '7d', '30d'];
const MAX_VISIBLE_CHIPS = 4;

/** Format a Date for a native date input without a timezone shift. */
function dateInputValue(value: Date | undefined): string {
  return value?.toISOString().slice(0, 10) ?? '';
}

/** Parse a native date input at the inclusive start/end of its UTC day. */
function parseDateInput(value: string, endOfDay: boolean): Date | undefined {
  if (!value) {
    return undefined;
  }
  return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
}

/**
 * Resolve the localized label for a date-range preset.
 *
 * @param t - Translator scoped to the `jobs` namespace.
 * @param preset - The preset key.
 * @returns The localized label.
 */
function presetLabel(t: ReturnType<typeof useTranslations<'jobs'>>, preset: DatePreset): string {
  switch (preset) {
    case 'today':
      return t('filters.presetToday');
    case '3d':
      return t('filters.preset3d');
    case '7d':
      return t('filters.preset7d');
    case '30d':
      return t('filters.preset30d');
    default: {
      const exhaustiveCheck: never = preset;
      return exhaustiveCheck;
    }
  }
}

/** Props accepted by {@link FilterBar}. */
export interface FilterBarProps {
  readonly params: JobsListParams;
  readonly searchInputRef?: RefObject<HTMLInputElement | null>;
  /** Persist current filters as a user saved view. */
  readonly onSaveView?: (() => void) | undefined;
}

/**
 * Two-line chip filter bar with a live advanced filters sheet.
 *
 * @param props - Filter bar props.
 * @returns The filter bar element.
 */
export function FilterBar({ params, searchInputRef, onSaveView }: FilterBarProps) {
  const t = useTranslations('jobs');
  const tStages = useTranslations('stages');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const rawSearchParams = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);

  const { data: sources } = useQuery({
    queryKey: queryKeys.sources.all,
    queryFn: ({ signal }) => listSources(signal),
    staleTime: 5 * 60 * 1000,
  });

  const sourceOptions = useMemo(
    () => (sources ?? []).map((source) => ({ value: String(source.id), label: source.name })),
    [sources],
  );
  const stageOptions = useMemo(
    () => STAGE_VALUES.map((value) => ({ value, label: tStages(value) })),
    [tStages],
  );

  const applyPatch = useCallback(
    (patch: Partial<JobsListParams>): void => {
      const next: JobsListParams = { ...params, ...patch, offset: 0 };
      const nextSearchParams = jobsListParamsToSearchParams(next);
      const preservedJob = rawSearchParams.get('job');
      if (preservedJob) {
        nextSearchParams.set('job', preservedJob);
      }
      const view = rawSearchParams.get('view');
      if (view) {
        nextSearchParams.set('view', view);
      }
      const query = nextSearchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, rawSearchParams, router],
  );

  const activeCount = countActiveFilters(params);

  const handlePreset = (preset: DatePreset): void => {
    const { from, to } = resolveDatePreset(preset);
    applyPatch({ dateField: params.dateField ?? 'posted', dateFrom: from, dateTo: to });
  };

  const handleReset = (): void => {
    applyPatch({
      sources: undefined,
      tags: undefined,
      remote: undefined,
      reaction: undefined,
      status: undefined,
      scoreMin: undefined,
      scoreMax: undefined,
      salaryMin: undefined,
      dateField: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      query: undefined,
    });
  };

  const chips = useMemo((): readonly FilterChip[] => {
    const next: FilterChip[] = [];
    if (params.query) {
      next.push({
        id: 'query',
        label: `“${params.query}”`,
        onRemove: () => applyPatch({ query: undefined }),
      });
    }
    for (const sourceId of params.sources ?? []) {
      const label = sourceOptions.find((option) => option.value === sourceId)?.label ?? sourceId;
      next.push({
        id: `source-${sourceId}`,
        label: `${t('filters.sources')}: ${label}`,
        onRemove: () => {
          const remaining = (params.sources ?? []).filter((id) => id !== sourceId);
          applyPatch({ sources: remaining.length > 0 ? remaining : undefined });
        },
      });
    }
    for (const stage of params.reaction ?? []) {
      next.push({
        id: `stage-${stage}`,
        label: `${t('filters.stage')}: ${tStages(stage as 'saved')}`,
        onRemove: () => {
          const remaining = (params.reaction ?? []).filter((value) => value !== stage);
          applyPatch({ reaction: remaining.length > 0 ? remaining : undefined });
        },
      });
    }
    for (const tag of params.tags ?? []) {
      next.push({
        id: `tag-${tag}`,
        label: `${t('filters.tags')}: ${tag}`,
        onRemove: () => {
          const remaining = (params.tags ?? []).filter((value) => value !== tag);
          applyPatch({ tags: remaining.length > 0 ? remaining : undefined });
        },
      });
    }
    if (params.scoreMin !== undefined && params.scoreMin > 0) {
      next.push({
        id: 'scoreMin',
        label: `${t('filters.scoreMin')} ≥ ${params.scoreMin}`,
        onRemove: () => applyPatch({ scoreMin: undefined }),
      });
    }
    if (params.scoreMax !== undefined) {
      next.push({
        id: 'scoreMax',
        label: `${t('filters.scoreMax')} ≤ ${params.scoreMax}`,
        onRemove: () => applyPatch({ scoreMax: undefined }),
      });
    }
    for (const remote of params.remote ?? []) {
      next.push({
        id: `remote-${remote}`,
        label: t(`filters.remote.${remote}` as 'filters.remote.remote'),
        onRemove: () => {
          const remaining = (params.remote ?? []).filter((value) => value !== remote);
          applyPatch({ remote: remaining.length > 0 ? remaining : undefined });
        },
      });
    }
    if (params.salaryMin !== undefined) {
      next.push({
        id: 'salaryMin',
        label: `${t('filters.salaryMin')} ≥ ${params.salaryMin}`,
        onRemove: () => applyPatch({ salaryMin: undefined }),
      });
    }
    if ((params.status ?? []).includes('hidden')) {
      next.push({
        id: 'hidden',
        label: t('filters.showHidden'),
        onRemove: () => applyPatch({ status: undefined }),
      });
    }
    if (params.dateFrom || params.dateTo) {
      next.push({
        id: 'dateRange',
        label: t('filters.dateRangeChip'),
        onRemove: () =>
          applyPatch({ dateFrom: undefined, dateTo: undefined, dateField: undefined }),
      });
    }
    return next;
  }, [applyPatch, params, sourceOptions, t, tStages]);

  const visibleChips = chips.slice(0, MAX_VISIBLE_CHIPS);
  const overflowChips = chips.slice(MAX_VISIBLE_CHIPS);
  const sortBy = params.sortBy ?? 'posted';
  const sortDir = params.sortDir ?? 'desc';

  return (
    <div className="flex flex-col gap-2">
      {/* Line 1 — always visible */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-md">
          <Search
            aria-hidden="true"
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <Input
            ref={searchInputRef}
            value={params.query ?? ''}
            onChange={(event) => applyPatch({ query: event.target.value || undefined })}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="h-9 bg-[var(--surface)] pl-9"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen(true)}
        >
          <SlidersHorizontal aria-hidden="true" size={14} />
          {activeCount > 0 ? t('filters.openCounted', { count: activeCount }) : t('filters.open')}
          <ChevronDown aria-hidden="true" size={14} />
        </Button>

        <Select
          value={`${sortBy}:${sortDir}`}
          onValueChange={(value) => {
            const [nextSortBy, nextSortDir] = value.split(':') as [JobSortBy, SortDir];
            applyPatch({ sortBy: nextSortBy, sortDir: nextSortDir });
          }}
        >
          <SelectTrigger className="h-9 w-auto min-w-36" aria-label={t('filters.sort')}>
            <SelectValue placeholder={t('filters.sort')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="posted:desc">{t('filters.sortPostedDesc')}</SelectItem>
            <SelectItem value="posted:asc">{t('filters.sortPostedAsc')}</SelectItem>
            <SelectItem value="score:desc">{t('filters.sortScoreDesc')}</SelectItem>
            <SelectItem value="salary:desc">{t('filters.sortSalaryDesc')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Line 2 — only when filters active */}
      {chips.length > 0 && (
        <div className="flex max-w-full flex-wrap items-center gap-1.5">
          {visibleChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--accent-muted)] px-2 py-0.5 text-xs text-[var(--text-primary)]"
            >
              <span className="max-w-40 truncate">{chip.label}</span>
              <X aria-hidden="true" size={10} className="text-[var(--text-secondary)]" />
              <span className="sr-only">{t('filters.removeChip')}</span>
            </button>
          ))}
          {overflowChips.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs">
                  +{overflowChips.length}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 space-y-1">
                {overflowChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={chip.onRemove}
                    className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs hover:bg-[var(--surface-sunken)]"
                  >
                    <span className="truncate">{chip.label}</span>
                    <X aria-hidden="true" size={10} />
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {chips.length >= 2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="ml-auto text-[var(--text-secondary)]"
            >
              {t('filters.clearAll')}
            </Button>
          )}
        </div>
      )}

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-[360px] gap-0 overflow-y-auto p-0"
          closeLabel={tCommon('close')}
        >
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <SheetTitle>{t('filters.panelTitle')}</SheetTitle>
            <SheetDescription className="sr-only">{t('filters.panelDescription')}</SheetDescription>
          </div>
          <div className="flex flex-col gap-4 px-4 py-4">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {t('filters.sources')}
              </span>
              <MultiSelect
                label={t('filters.sources')}
                options={sourceOptions}
                selected={params.sources ?? []}
                onChange={(values) =>
                  applyPatch({ sources: values.length > 0 ? values : undefined })
                }
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {t('filters.stage')}
              </span>
              <MultiSelect
                label={t('filters.stage')}
                options={stageOptions}
                selected={params.reaction ?? []}
                onChange={(values) =>
                  applyPatch({ reaction: values.length > 0 ? values : undefined })
                }
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {t('filters.tags')}
              </span>
              <TagsInput
                value={params.tags ?? []}
                onChange={(tags) => applyPatch({ tags: tags.length > 0 ? tags : undefined })}
                placeholder={t('filters.tags')}
                aria-label={t('filters.tags')}
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {t('filters.scoreRange')}
              </span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums w-8 text-xs text-[var(--text-secondary)]">
                  {params.scoreMin ?? 0}
                </span>
                <Slider
                  value={[params.scoreMin ?? 0, params.scoreMax ?? 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([min, max]) =>
                    applyPatch({
                      scoreMin: min && min > 0 ? min : undefined,
                      scoreMax: max !== undefined && max < 100 ? max : undefined,
                    })
                  }
                  aria-label={t('filters.scoreRange')}
                />
                <span className="tabular-nums w-8 text-right text-xs text-[var(--text-secondary)]">
                  {params.scoreMax ?? 100}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {t('filters.postedWindow')}
              </span>
              <div className="flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-0.5">
                {DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreset(preset)}
                  >
                    {presetLabel(t, preset)}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="space-y-1 text-xs font-medium text-[var(--text-primary)]">
                  <span>{t('filters.dateFrom')}</span>
                  <Input
                    type="date"
                    aria-label={t('filters.dateFrom')}
                    value={dateInputValue(params.dateFrom)}
                    onChange={(event) =>
                      applyPatch({ dateFrom: parseDateInput(event.target.value, false) })
                    }
                    className="h-8"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--text-primary)]">
                  <span>{t('filters.dateTo')}</span>
                  <Input
                    type="date"
                    aria-label={t('filters.dateTo')}
                    value={dateInputValue(params.dateTo)}
                    onChange={(event) =>
                      applyPatch({ dateTo: parseDateInput(event.target.value, true) })
                    }
                    className="h-8"
                  />
                </label>
              </div>
              <Select
                value={params.dateField ?? 'posted'}
                onValueChange={(value) => applyPatch({ dateField: value as DateField })}
              >
                <SelectTrigger className="h-8 w-full" aria-label={t('filters.dateField')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="posted">{t('filters.dateFieldPosted')}</SelectItem>
                  <SelectItem value="first_seen">{t('filters.dateFieldFirstSeen')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {t('filters.remoteLabel')}
              </span>
              <div className="flex flex-wrap gap-2">
                {(['remote', 'hybrid', 'office'] as const).map((value) => {
                  const selected = (params.remote ?? []).includes(value);
                  return (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      className={cn(selected && 'shadow-[var(--elevation-1)]')}
                      onClick={() => {
                        const current = new Set(params.remote ?? []);
                        if (selected) {
                          current.delete(value);
                        } else {
                          current.add(value);
                        }
                        const next = [...current];
                        applyPatch({ remote: next.length > 0 ? next : undefined });
                      }}
                    >
                      {t(`filters.remote.${value}`)}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-[var(--text-primary)]"
                htmlFor="salary-min"
              >
                {t('filters.salaryMin')}
              </label>
              <Input
                id="salary-min"
                type="number"
                min={0}
                value={params.salaryMin ?? ''}
                onChange={(event) =>
                  applyPatch({
                    salaryMin: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                className="h-8"
              />
            </div>

            <label className="flex items-center justify-between gap-2 text-sm text-[var(--text-primary)]">
              <span>{t('filters.showHidden')}</span>
              <Switch
                checked={(params.status ?? []).includes('hidden')}
                onCheckedChange={(checked) =>
                  applyPatch({ status: checked ? ['hidden'] : undefined })
                }
              />
            </label>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              {t('filters.reset')}
            </Button>
            {onSaveView && (
              <Button type="button" size="sm" onClick={onSaveView}>
                {t('filters.saveAsView')}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
