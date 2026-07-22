/**
 * @module job-repository.port
 *
 * Port for reading and filtering normalized jobs. Implementations live in the
 * infrastructure layer (Postgres). Write paths are intentionally absent: jobs
 * are created by the scraper/LLM pipeline.
 */
import type { Job } from '../../domain/job.model';

/**
 * Supported date fields for interval filtering.
 */
export type DateField = 'posted' | 'first_seen';

/**
 * Sortable columns for the jobs list endpoint. `lastSeen` (the historical
 * default) sorts by scraper recency; the others back the jobs-dashboard
 * table's sortable columns.
 */
export type JobSortBy = 'score' | 'posted' | 'salary' | 'lastSeen' | 'board';

/** Sort direction for {@link JobSortBy}. */
export type SortDir = 'asc' | 'desc';

/**
 * Filter parameters for the jobs list endpoint.
 */
export interface JobFilter {
  readonly sourceIds?: readonly number[] | undefined;
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
  readonly limit: number;
  readonly offset: number;
}

/**
 * Paginated list result.
 */
export interface PaginatedJobs {
  readonly items: readonly Job[];
  readonly total: number;
}

/**
 * Job repository contract.
 */
export interface JobRepository {
  /**
   * List jobs matching the filter, sorted per {@link JobFilter.sortBy} /
   * {@link JobFilter.sortDir} (default: `lastSeen` descending).
   *
   * @param filter - Query constraints and pagination.
   * @returns Matching jobs plus total count.
   */
  findMany(filter: JobFilter): Promise<PaginatedJobs>;

  /**
   * Get a single job by id, including denormalized source slug.
   *
   * @param id - Job primary key.
   * @returns The job or `null` if not found.
   */
  findById(id: bigint): Promise<Job | null>;

  /**
   * Hide (or un-hide) a job by setting its status.
   *
   * @param id - Job primary key.
   * @param status - New status value.
   * @returns The updated job or `null` if not found.
   */
  setStatus(id: bigint, status: 'archived' | 'hidden' | 'processed' | 'new'): Promise<Job | null>;

  /**
   * Delete a normalized job and its cascading user-facing dependents.
   *
   * @param id - Job primary key.
   * @returns `true` when a normalized job row was deleted, otherwise `false`.
   */
  delete(id: bigint): Promise<boolean>;

  /**
   * Delete multiple normalized jobs and their cascading user-facing
   * dependents in one operation. IDs with no matching row are silently
   * skipped.
   *
   * @param ids - Job primary keys.
   * @returns The number of rows actually deleted.
   */
  deleteMany(ids: readonly bigint[]): Promise<number>;
}

/**
 * Injection token for the job repository port.
 */
export const JOB_REPOSITORY = Symbol('JOB_REPOSITORY');
