/**
 * @module jobs.service.spec
 *
 * Unit tests for {@link JobsService} using an in-memory repository fake.
 */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Job, JobStatus } from '../domain/job.model';
import type {
  JobFilter,
  JobRepository,
  PaginatedJobs,
} from '../application/ports/job-repository.port';
import { JobsService } from './jobs.service';

/**
 * Build a job fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Job fixture.
 */
function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1n,
    sourceId: 1,
    sourceSlug: 'dou',
    externalId: 'ext-1',
    url: 'https://example.com/jobs/1',
    title: 'Backend Engineer',
    company: 'Acme',
    descriptionMd: null,
    summary: null,
    tags: [],
    redFlags: [],
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    seniority: 'unknown',
    remote: 'unknown',
    location: null,
    postedAt: null,
    firstSeenAt: new Date('2026-07-01T00:00:00Z'),
    lastSeenAt: new Date('2026-07-02T00:00:00Z'),
    status: 'new',
    matchScore: null,
    currentReaction: null,
    ...overrides,
  };
}

/**
 * In-memory {@link JobRepository} fake.
 */
class FakeJobRepository implements JobRepository {
  public jobs: Job[] = [];
  public lastFilter: JobFilter | null = null;
  public deleteError: Error | null = null;

  public findMany(filter: JobFilter): Promise<PaginatedJobs> {
    this.lastFilter = filter;
    const items = this.jobs.slice(filter.offset, filter.offset + filter.limit);
    return Promise.resolve({
      items,
      total: this.jobs.length,
      highFit: 0,
      inMotion: 0,
      unreviewed: this.jobs.length,
    });
  }

  public findById(id: bigint): Promise<Job | null> {
    return Promise.resolve(this.jobs.find((job) => job.id === id) ?? null);
  }

  public setStatus(id: bigint, status: JobStatus): Promise<Job | null> {
    const index = this.jobs.findIndex((job) => job.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const updated = makeJob({ ...this.jobs[index], status });
    this.jobs[index] = updated;
    return Promise.resolve(updated);
  }

  public delete(id: bigint): Promise<boolean> {
    if (this.deleteError) {
      return Promise.reject(this.deleteError);
    }
    const index = this.jobs.findIndex((job) => job.id === id);
    if (index === -1) {
      return Promise.resolve(false);
    }
    this.jobs.splice(index, 1);
    return Promise.resolve(true);
  }

  public deleteMany(ids: readonly bigint[]): Promise<number> {
    if (this.deleteError) {
      return Promise.reject(this.deleteError);
    }
    const idSet = new Set(ids);
    const before = this.jobs.length;
    this.jobs = this.jobs.filter((job) => !idSet.has(job.id));
    return Promise.resolve(before - this.jobs.length);
  }
}

describe('JobsService', () => {
  let repository: FakeJobRepository;
  let service: JobsService;

  beforeEach(() => {
    repository = new FakeJobRepository();
    service = new JobsService(repository);
  });

  it('lists jobs with pagination and forwards the filter', async () => {
    repository.jobs = [makeJob({ id: 1n }), makeJob({ id: 2n }), makeJob({ id: 3n })];

    const result = await service.list({ limit: 2, offset: 1 });

    expect(result.total).toBe(3);
    expect(result.items.map((job) => job.id)).toEqual([2n, 3n]);
    expect(repository.lastFilter).toEqual({ limit: 2, offset: 1 });
  });

  it('forwards sort parameters to the repository', async () => {
    repository.jobs = [makeJob({ id: 1n })];

    await service.list({ limit: 20, offset: 0, sortBy: 'score', sortDir: 'asc' });

    expect(repository.lastFilter).toEqual({
      limit: 20,
      offset: 0,
      sortBy: 'score',
      sortDir: 'asc',
    });
  });

  it('returns job detail by id', async () => {
    repository.jobs = [makeJob({ id: 7n, title: 'Senior TS Dev' })];

    const job = await service.detail(7n);

    expect(job.title).toBe('Senior TS Dev');
  });

  it('throws NotFoundException for a missing job', async () => {
    await expect(service.detail(99n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('surfaces the match explanation on detail when present', async () => {
    repository.jobs = [makeJob({ id: 5n, matchExplanation: 'Strong skills overlap' })];

    const job = await service.detail(5n);

    expect(job.matchExplanation).toBe('Strong skills overlap');
  });

  it('omits the match explanation key entirely when not joined', async () => {
    repository.jobs = [makeJob({ id: 6n })];

    const job = await service.detail(6n);

    expect('matchExplanation' in job).toBe(false);
  });

  it('updates job status', async () => {
    repository.jobs = [makeJob({ id: 1n, status: 'new' })];

    const job = await service.setStatus(1n, 'archived');

    expect(job.status).toBe('archived');
  });

  it('throws NotFoundException when updating status of a missing job', async () => {
    await expect(service.setStatus(42n, 'hidden')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an existing job', async () => {
    repository.jobs = [makeJob({ id: 1n }), makeJob({ id: 2n })];

    await expect(service.delete(1n)).resolves.toEqual({ deleted: true });
    expect(repository.jobs.map((job) => job.id)).toEqual([2n]);
  });

  it('throws NotFoundException when deleting a missing job', async () => {
    await expect(service.delete(42n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates repository deletion failures', async () => {
    repository.deleteError = new Error('database unavailable');

    await expect(service.delete(1n)).rejects.toThrow('database unavailable');
  });

  it('bulk-deletes all existing jobs', async () => {
    repository.jobs = [makeJob({ id: 1n }), makeJob({ id: 2n }), makeJob({ id: 3n })];

    await expect(service.bulkDelete([1n, 2n])).resolves.toBe(2);
    expect(repository.jobs.map((job) => job.id)).toEqual([3n]);
  });

  it('bulk-deletes only the ids that exist, without error', async () => {
    repository.jobs = [makeJob({ id: 1n })];

    await expect(service.bulkDelete([1n, 999999n])).resolves.toBe(1);
    expect(repository.jobs).toEqual([]);
  });

  it('bulk-deletes nothing for an empty id list', async () => {
    repository.jobs = [makeJob({ id: 1n })];

    await expect(service.bulkDelete([])).resolves.toBe(0);
    expect(repository.jobs.map((job) => job.id)).toEqual([1n]);
  });
});
