/**
 * @module jobs.service
 *
 * Application service for job queries and lightweight status updates. Keeps
 * HTTP details in the controller; this layer only orchestrates repository calls.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { Job, JobStatus } from '../domain/job.model';
import {
  JOB_REPOSITORY,
  type JobFilter,
  type JobRepository,
  type PaginatedJobs,
} from '../application/ports/job-repository.port';

/**
 * Application service for jobs.
 */
@Injectable()
export class JobsService {
  /**
   * Application service for jobs.
   *
   * @param repository - Job repository port.
   */
  public constructor(
    @Inject(JOB_REPOSITORY)
    private readonly repository: JobRepository,
  ) {}

  /**
   * List jobs with filters and pagination.
   *
   * @param filter - Query constraints.
   * @returns Paginated job list.
   */
  public async list(filter: JobFilter): Promise<PaginatedJobs> {
    return this.repository.findMany(filter);
  }

  /**
   * Get a single job by id.
   *
   * @param id - Job id.
   * @returns Job detail.
   * @throws NotFoundException when the job does not exist.
   */
  public async detail(id: bigint): Promise<Job> {
    const job = await this.repository.findById(id);
    if (job === null) {
      throw new NotFoundException(`Job ${id.toString()} not found`);
    }
    return job;
  }

  /**
   * Hide, archive, or restore a job.
   *
   * @param id - Job id.
   * @param status - New status.
   * @returns Updated job.
   * @throws NotFoundException when the job does not exist.
   */
  public async setStatus(id: bigint, status: JobStatus): Promise<Job> {
    const job = await this.repository.setStatus(id, status);
    if (job === null) {
      throw new NotFoundException(`Job ${id.toString()} not found`);
    }
    return job;
  }

  /**
   * Permanently delete a job and its user-facing dependent records.
   *
   * @param id - Job id.
   * @returns A successful deletion result.
   * @throws NotFoundException when the job does not exist.
   */
  public async delete(id: bigint): Promise<{ readonly deleted: true }> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Job ${id.toString()} not found`);
    }
    return { deleted: true };
  }

  /**
   * Permanently delete multiple jobs and their user-facing dependent
   * records. IDs with no matching row are silently skipped.
   *
   * @param ids - Job ids.
   * @returns The number of jobs actually deleted.
   */
  public async bulkDelete(ids: readonly bigint[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }
}
