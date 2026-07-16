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

  public findMany(filter: JobFilter): Promise<PaginatedJobs> {
    this.lastFilter = filter;
    const items = this.jobs.slice(filter.offset, filter.offset + filter.limit);
    return Promise.resolve({ items, total: this.jobs.length });
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

  it('returns job detail by id', async () => {
    repository.jobs = [makeJob({ id: 7n, title: 'Senior TS Dev' })];

    const job = await service.detail(7n);

    expect(job.title).toBe('Senior TS Dev');
  });

  it('throws NotFoundException for a missing job', async () => {
    await expect(service.detail(99n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates job status', async () => {
    repository.jobs = [makeJob({ id: 1n, status: 'new' })];

    const job = await service.setStatus(1n, 'archived');

    expect(job.status).toBe('archived');
  });

  it('throws NotFoundException when updating status of a missing job', async () => {
    await expect(service.setStatus(42n, 'hidden')).rejects.toBeInstanceOf(NotFoundException);
  });
});
