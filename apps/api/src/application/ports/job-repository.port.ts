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
   * List jobs matching the filter, sorted by `last_seen_at DESC`.
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
}

/**
 * Injection token for the job repository port.
 */
export const JOB_REPOSITORY = Symbol('JOB_REPOSITORY');
