/**
 * @module lib/jobs/search-params
 *
 * Parses/serializes the `/jobs` filter bar's state to and from URL search
 * params (design.md D2: "filter state lives in the URL"). Hand-rolled
 * rather than `nuqs` — the param set is small and fully known.
 */
import type { DateField, JobsListParams, JobSortBy, SortDir } from '@/lib/api/jobs';

/** Shape of Next.js's `searchParams` prop (already-`await`ed). */
export type RawSearchParams = Record<string, string | readonly string[] | undefined>;

/** Default page size for the jobs list. */
export const DEFAULT_JOBS_LIMIT = 20;

const DATE_FIELDS: readonly DateField[] = ['posted', 'first_seen'];
const SORT_BY_VALUES: readonly JobSortBy[] = ['score', 'posted', 'salary', 'lastSeen'];
const SORT_DIR_VALUES: readonly SortDir[] = ['asc', 'desc'];

/**
 * Take the first value when a search param repeats (Next.js allows
 * `?a=1&a=2` to arrive as an array).
 *
 * @param value - Raw search param value.
 * @returns The first string value, or `undefined`.
 */
function first(value: string | readonly string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  return value[0];
}

/**
 * Split a comma-separated search param into a trimmed, non-empty array.
 *
 * @param value - Raw comma-separated value.
 * @returns The parsed array, or `undefined` when absent/empty.
 */
function splitCsv(value: string | undefined): readonly string[] | undefined {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

/**
 * Parse a numeric search param.
 *
 * @param value - Raw value.
 * @returns The parsed number, or `undefined` when absent/invalid.
 */
function parseNumberParam(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Parse an ISO-date search param.
 *
 * @param value - Raw value.
 * @returns The parsed date, or `undefined` when absent/invalid.
 */
function parseDateParam(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Parse a value against a fixed allowlist.
 *
 * @param value - Raw value.
 * @param allowed - Allowed literal values.
 * @returns `value` narrowed to `T`, or `undefined` when not in `allowed`.
 */
function parseEnumParam<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/**
 * Parse Next.js's raw `searchParams` into typed jobs-list filters.
 *
 * @param searchParams - Already-`await`ed `searchParams` from the page prop.
 * @returns Parsed filters, ready for `listJobs`/`useJobsQuery`.
 */
export function parseJobsSearchParams(searchParams: RawSearchParams): JobsListParams {
  return {
    sources: splitCsv(first(searchParams['sources'])),
    tags: splitCsv(first(searchParams['tags'])),
    remote: splitCsv(first(searchParams['remote'])),
    seniority: splitCsv(first(searchParams['seniority'])),
    status: splitCsv(first(searchParams['status'])),
    reaction: splitCsv(first(searchParams['reaction'])),
    scoreMin: parseNumberParam(first(searchParams['scoreMin'])),
    scoreMax: parseNumberParam(first(searchParams['scoreMax'])),
    salaryMin: parseNumberParam(first(searchParams['salaryMin'])),
    salaryMax: parseNumberParam(first(searchParams['salaryMax'])),
    dateField: parseEnumParam(first(searchParams['dateField']), DATE_FIELDS),
    dateFrom: parseDateParam(first(searchParams['dateFrom'])),
    dateTo: parseDateParam(first(searchParams['dateTo'])),
    query: first(searchParams['query']) || undefined,
    sortBy: parseEnumParam(first(searchParams['sortBy']), SORT_BY_VALUES),
    sortDir: parseEnumParam(first(searchParams['sortDir']), SORT_DIR_VALUES),
    limit: parseNumberParam(first(searchParams['limit'])) ?? DEFAULT_JOBS_LIMIT,
    offset: parseNumberParam(first(searchParams['offset'])) ?? 0,
  };
}

/**
 * Serialize jobs-list filters back into a `URLSearchParams`, for building
 * shareable URLs and syncing the filter bar's state to the address bar.
 * Mirrors `parseJobsSearchParams` exactly so round-tripping is lossless.
 *
 * @param params - Filters to serialize.
 * @returns A `URLSearchParams` with only the active (non-default) filters.
 */
export function jobsListParamsToSearchParams(params: JobsListParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  const setCsv = (key: string, value: readonly string[] | undefined): void => {
    if (value && value.length > 0) {
      searchParams.set(key, value.join(','));
    }
  };
  const setNumber = (key: string, value: number | undefined): void => {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  };

  setCsv('sources', params.sources);
  setCsv('tags', params.tags);
  setCsv('remote', params.remote);
  setCsv('seniority', params.seniority);
  setCsv('status', params.status);
  setCsv('reaction', params.reaction);
  setNumber('scoreMin', params.scoreMin);
  setNumber('scoreMax', params.scoreMax);
  setNumber('salaryMin', params.salaryMin);
  setNumber('salaryMax', params.salaryMax);
  if (params.dateField) {
    searchParams.set('dateField', params.dateField);
  }
  if (params.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom.toISOString());
  }
  if (params.dateTo) {
    searchParams.set('dateTo', params.dateTo.toISOString());
  }
  if (params.query) {
    searchParams.set('query', params.query);
  }
  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params.sortDir) {
    searchParams.set('sortDir', params.sortDir);
  }
  if (params.offset) {
    searchParams.set('offset', String(params.offset));
  }
  if (params.limit !== undefined && params.limit !== DEFAULT_JOBS_LIMIT) {
    searchParams.set('limit', String(params.limit));
  }

  return searchParams;
}

/**
 * Count the active (user-set) filters, excluding sort and pagination —
 * drives the FilterBar's chip list and the conditional "Reset" control.
 *
 * @param params - Current filters.
 * @returns The number of active filters.
 */
export function countActiveFilters(params: JobsListParams): number {
  const keys: readonly (keyof JobsListParams)[] = [
    'sources',
    'tags',
    'remote',
    'seniority',
    'status',
    'reaction',
    'scoreMin',
    'scoreMax',
    'salaryMin',
    'salaryMax',
    'dateFrom',
    'dateTo',
    'query',
  ];
  return keys.filter((key) => {
    const value = params[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== '';
  }).length;
}
