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
 * Sortable columns for the jobs list endpoint. `posted` is the default — a
 * triage list is read newest-posting-first. `lastSeen` (the historical
 * default) sorts by scraper recency, which reshuffled the list on every
 * re-scrape; the others back the jobs-dashboard table's sortable columns.
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
 *
 * The three metric counts share `total`'s scope: they describe every row
 * matching the filter, not just the current page. The jobs-dashboard summary
 * panel renders them side by side with `total`, so mixing scopes there would
 * misreport the pipeline (docs/UI_DESIGN.md §5.1).
 */
export interface PaginatedJobs {
  readonly items: readonly Job[];
  readonly total: number;
  /** Matching jobs scoring >= 80, treating an absent match as 0. */
  readonly highFit: number;
  /** Matching jobs whose latest reaction is applied/interview/offer. */
  readonly inMotion: number;
  /** Matching jobs with no reaction recorded yet. */
  readonly unreviewed: number;
}

/**
 * Job repository contract.
 */
export interface JobRepository {
  /**
   * List jobs matching the filter, sorted per {@link JobFilter.sortBy} /
   * {@link JobFilter.sortDir} (default: `posted` descending).
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
