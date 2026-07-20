/**
 * @module lib/api/jobs
 *
 * Typed functions for the `/jobs` resource. Ids stay `string` everywhere on
 * the web side (design.md D-notes) — the API accepts bigint-as-string path
 * segments, so no numeric conversion happens here.
 */
import { apiRequest } from './client';
import type { OperationBody, OperationResponse } from './types';

/** A single `DateField` value accepted by the jobs list filter. */
export type DateField = 'posted' | 'first_seen';

/**
 * Sortable jobs-list columns. `'board'` orders by manual board card
 * position (design.md D4 in
 * openspec/changes/notification-settings-and-board-reorder) — the board
 * page uses it internally; it's not offered as a `/jobs` table sort option
 * (see `lib/jobs/search-params.ts`'s narrower `SORT_BY_VALUES`).
 */
export type JobSortBy = 'score' | 'posted' | 'salary' | 'lastSeen' | 'board';

/** Sort direction accepted by {@link listJobs}. */
export type SortDir = 'asc' | 'desc';

/**
 * Filters accepted by {@link listJobs}, mirroring `ListJobsQueryDto`. Every
 * field explicitly allows `undefined` (not just omission) so callers —
 * chiefly `parseJobsSearchParams` — can build this object from optional URL
 * search params without `exactOptionalPropertyTypes` friction.
 */
export interface JobsListParams {
  readonly sources?: readonly string[] | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly remote?: readonly string[] | undefined;
  readonly seniority?: readonly string[] | undefined;
  readonly status?: readonly string[] | undefined;
  readonly reaction?: readonly string[] | undefined;
  readonly scoreMin?: number | undefined;
  readonly scoreMax?: number | undefined;
  readonly salaryMin?: number | undefined;
  readonly salaryMax?: number | undefined;
  readonly dateField?: DateField | undefined;
  readonly dateFrom?: Date | undefined;
  readonly dateTo?: Date | undefined;
  readonly query?: string | undefined;
  readonly sortBy?: JobSortBy | undefined;
  readonly sortDir?: SortDir | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

/** Paginated jobs list response. */
export type PaginatedJobs = OperationResponse<'JobsController_list_v1'>;

/** Single job, as returned by list/status endpoints. */
export type Job = OperationResponse<'JobsController_setStatus_v1'>;

/** Job detail response, including `matchExplanation`. */
export type JobDetail = OperationResponse<'JobsController_detail_v1'>;

/** Body accepted by {@link setJobStatus}. */
export type SetJobStatusBody = OperationBody<'JobsController_setStatus_v1'>;

/**
 * List jobs with filters, full-text search, and pagination.
 *
 * @param params - Filters, search query, and pagination.
 * @param signal - Optional abort signal.
 * @returns The paginated jobs response.
 */
export async function listJobs(
  params: JobsListParams = {},
  signal?: AbortSignal,
): Promise<PaginatedJobs> {
  return apiRequest<PaginatedJobs>('/jobs', { query: { ...params }, signal });
}

/**
 * Get a single job by id, including its match explanation.
 *
 * @param id - Job id (bigint as string).
 * @param signal - Optional abort signal.
 * @returns The job detail response.
 */
export async function getJob(id: string, signal?: AbortSignal): Promise<JobDetail> {
  return apiRequest<JobDetail>(`/jobs/${id}`, { signal });
}

/**
 * Update a job's status (archive, hide, restore).
 *
 * @param id - Job id (bigint as string).
 * @param status - New job status.
 * @returns The updated job.
 */
export async function setJobStatus(id: string, status: SetJobStatusBody['status']): Promise<Job> {
  return apiRequest<Job>(`/jobs/${id}/status`, { method: 'PATCH', body: { status } });
}
