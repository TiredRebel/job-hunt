'use client';

/**
 * @module components/jobs/filter-bar
 *
 * Sticky filter bar for `/jobs` (docs/UI_DESIGN.md §5.1, jobs-dashboard
 * spec "Filter bar with URL-persisted state"). Reads filters from the
 * current URL and writes changes back via `router.replace`, so the table
 * and filter bar stay in sync purely through the URL (design.md D2).
 */
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, type RefObject } from 'react';

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
import { useRouter, usePathname } from '@/i18n/navigation';
import type { DateField, JobsListParams } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';
import { listSources } from '@/lib/api/sources';
import type { DatePreset } from '@/lib/jobs/date-presets';
import { resolveDatePreset } from '@/lib/jobs/date-presets';
import { countActiveFilters, jobsListParamsToSearchParams } from '@/lib/jobs/search-params';

import { MultiSelect } from './multi-select';
import { TagsInput } from './tags-input';

/** A removable chip describing one active filter. */
interface FilterChip {
  readonly id: string;
  readonly label: string;
  readonly onRemove: () => void;
}

const STAGE_VALUES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
const DATE_PRESETS: readonly DatePreset[] = ['today', '3d', '7d', '30d'];

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
}

/**
 * Sticky filter bar driving the `/jobs` table's server-side filters.
 *
 * @param props - Filter bar props.
 * @returns The filter bar element.
 */
export function FilterBar({ params, searchInputRef }: FilterBarProps) {
  const t = useTranslations('jobs');
  const tStages = useTranslations('stages');
  const router = useRouter();
  const pathname = usePathname();
  const rawSearchParams = useSearchParams();

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
      scoreMin: undefined,
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
        label: `${t('searchPlaceholder')} “${params.query}”`,
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
    if ((params.remote ?? []).includes('remote')) {
      next.push({
        id: 'remote',
        label: t('filters.remoteOnly'),
        onRemove: () => applyPatch({ remote: undefined }),
      });
    }
    if (params.salaryMin !== undefined) {
      next.push({
        id: 'salaryMin',
        label: `${t('filters.salaryMin')} ≥ ${params.salaryMin}`,
        onRemove: () => applyPatch({ salaryMin: undefined }),
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

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        <Input
          ref={searchInputRef}
          value={params.query ?? ''}
          onChange={(event) => applyPatch({ query: event.target.value || undefined })}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="h-8 w-48"
        />

        <MultiSelect
          label={t('filters.sources')}
          options={sourceOptions}
          selected={params.sources ?? []}
          onChange={(values) => applyPatch({ sources: values.length > 0 ? values : undefined })}
        />

        <MultiSelect
          label={t('filters.stage')}
          options={stageOptions}
          selected={params.reaction ?? []}
          onChange={(values) => applyPatch({ reaction: values.length > 0 ? values : undefined })}
        />

        <div className="w-40">
          <TagsInput
            value={params.tags ?? []}
            onChange={(tags) => applyPatch({ tags: tags.length > 0 ? tags : undefined })}
            placeholder={t('filters.tags')}
            aria-label={t('filters.tags')}
          />
        </div>

        <div className="flex w-36 items-center gap-2">
          <span className="shrink-0 text-xs text-text-muted">{t('filters.scoreMin')}</span>
          <Slider
            value={[params.scoreMin ?? 0]}
            min={0}
            max={100}
            step={5}
            onValueChange={([next]) =>
              applyPatch({ scoreMin: next && next > 0 ? next : undefined })
            }
            aria-label={t('filters.scoreMin')}
          />
          <span className="tabular-nums w-6 shrink-0 text-right text-xs text-text-muted">
            {params.scoreMin ?? 0}
          </span>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-text-muted">
          <Switch
            checked={(params.remote ?? []).includes('remote')}
            onCheckedChange={(checked) => applyPatch({ remote: checked ? ['remote'] : undefined })}
          />
          {t('filters.remoteOnly')}
        </label>

        <Input
          type="number"
          min={0}
          value={params.salaryMin ?? ''}
          onChange={(event) =>
            applyPatch({ salaryMin: event.target.value ? Number(event.target.value) : undefined })
          }
          placeholder={t('filters.salaryMin')}
          aria-label={t('filters.salaryMin')}
          className="h-8 w-28"
        />

        <Select
          value={params.dateField ?? 'posted'}
          onValueChange={(value) => applyPatch({ dateField: value as DateField })}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="posted">{t('filters.dateFieldPosted')}</SelectItem>
            <SelectItem value="first_seen">{t('filters.dateFieldFirstSeen')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset(preset)}
            >
              {presetLabel(t, preset)}
            </Button>
          ))}
        </div>

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-text-muted"
          >
            {t('filters.reset')}
          </Button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-[calc(var(--radius-control)-2px)] border border-border bg-surface-elevated px-1.5 py-0.5 text-xs text-text-primary hover:bg-surface"
            >
              <span className="max-w-48 truncate">{chip.label}</span>
              <X aria-hidden="true" size={10} className="text-text-muted" />
              <span className="sr-only">{t('filters.removeChip')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
