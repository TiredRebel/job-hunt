/**
 * @module lib/hooks/use-jobs-query
 *
 * Client-side jobs-list query, keyed on the same filter shape the server
 * page fetches with (design.md D1: server fetch page 1, client hydrates
 * with `initialData` then TanStack Query owns refetching on filter change).
 */
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listJobs, type JobsListParams, type PaginatedJobs } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * Query the jobs list for the given filters.
 *
 * @param params - Current filters (parsed from the URL).
 * @param initialData - Server-fetched first page, used to hydrate without a
 * client refetch on first paint.
 * @returns The TanStack Query result for the jobs list.
 */
export function useJobsQuery(
  params: JobsListParams,
  initialData?: PaginatedJobs,
): UseQueryResult<PaginatedJobs> {
  return useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: ({ signal }) => listJobs(params, signal),
    placeholderData: keepPreviousData,
    ...(initialData ? { initialData } : {}),
  });
}
