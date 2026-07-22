/**
 * @module cover-letters.service.spec
 *
 * Unit tests for {@link CoverLettersService} using in-memory repository
 * fakes.
 */
import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CoverLetter } from '../domain/cover-letter.model';
import type { Job } from '../domain/job.model';
import type { Profile } from '../domain/profile.model';
import type { CoverLetterRepository } from '../application/ports/cover-letter-repository.port';
import type { JobRepository, PaginatedJobs } from '../application/ports/job-repository.port';
import type {
  GenerateCoverLetterInput,
  GeneratedCoverLetter,
  LlmCoverLetterClient,
} from '../application/ports/llm-cover-letter-client.port';
import { LlmUpstreamError } from '../application/ports/llm-cover-letter-client.port';
import type {
  CreateProfileInput,
  ProfileRepository,
  UpdateProfileInput,
} from '../application/ports/profile-repository.port';
import { CoverLettersService } from './cover-letters.service';

/**
 * In-memory {@link CoverLetterRepository} fake.
 */
class FakeCoverLetterRepository implements CoverLetterRepository {
  public letters: CoverLetter[] = [];
  private nextId = 1n;

  public findByJobId(jobId: bigint, profileId: number): Promise<CoverLetter | null> {
    return Promise.resolve(
      this.letters.find((letter) => letter.jobId === jobId && letter.profileId === profileId) ??
        null,
    );
  }

  public saveEdited(jobId: bigint, profileId: number, bodyMd: string): Promise<CoverLetter> {
    const existingIndex = this.letters.findIndex(
      (letter) => letter.jobId === jobId && letter.profileId === profileId,
    );
    const now = new Date('2026-07-16T00:00:00Z');
    if (existingIndex === -1) {
      const created: CoverLetter = {
        id: this.nextId,
        jobId,
        profileId,
        bodyMd,
        modelUsed: null,
        edited: true,
        createdAt: now,
        updatedAt: now,
      };
      this.nextId += 1n;
      this.letters.push(created);
      return Promise.resolve(created);
    }
    const existing = this.letters[existingIndex];
    if (existing === undefined) {
      throw new Error('Unreachable: index came from findIndex');
    }
    const updated: CoverLetter = { ...existing, bodyMd, edited: true, updatedAt: now };
    this.letters[existingIndex] = updated;
    return Promise.resolve(updated);
  }

  public saveGenerated(
    jobId: bigint,
    profileId: number,
    bodyMd: string,
    modelUsed: string | null,
  ): Promise<CoverLetter> {
    const existingIndex = this.letters.findIndex(
      (letter) => letter.jobId === jobId && letter.profileId === profileId,
    );
    const now = new Date('2026-07-16T00:00:00Z');
    if (existingIndex === -1) {
      const created: CoverLetter = {
        id: this.nextId,
        jobId,
        profileId,
        bodyMd,
        modelUsed,
        edited: false,
        createdAt: now,
        updatedAt: now,
      };
      this.nextId += 1n;
      this.letters.push(created);
      return Promise.resolve(created);
    }
    const existing = this.letters[existingIndex];
    if (existing === undefined) {
      throw new Error('Unreachable: index came from findIndex');
    }
    const updated: CoverLetter = { ...existing, bodyMd, modelUsed, edited: false, updatedAt: now };
    this.letters[existingIndex] = updated;
    return Promise.resolve(updated);
  }
}

/**
 * In-memory {@link JobRepository} fake with a single switchable job.
 */
class FakeJobRepository implements JobRepository {
  public job: Job | null = null;

  public findMany(): Promise<PaginatedJobs> {
    return Promise.resolve({ items: this.job ? [this.job] : [], total: this.job ? 1 : 0 });
  }

  public findById(id: bigint): Promise<Job | null> {
    return Promise.resolve(this.job !== null && this.job.id === id ? this.job : null);
  }

  public setStatus(): Promise<Job | null> {
    throw new Error('Not implemented in fake');
  }

  public delete(): Promise<boolean> {
    throw new Error('Not implemented in fake');
  }

  public deleteMany(): Promise<number> {
    throw new Error('Not implemented in fake');
  }
}

/**
 * In-memory {@link LlmCoverLetterClient} fake, scriptable to fail.
 */
class FakeLlmCoverLetterClient implements LlmCoverLetterClient {
  public calls: GenerateCoverLetterInput[] = [];
  public failure: LlmUpstreamError | null = null;
  public result: GeneratedCoverLetter = { bodyMd: 'Generated cover letter body.' };

  public generate(input: GenerateCoverLetterInput): Promise<GeneratedCoverLetter> {
    this.calls.push(input);
    if (this.failure) {
      return Promise.reject(this.failure);
    }
    return Promise.resolve(this.result);
  }
}

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 42n,
    sourceId: 1,
    sourceSlug: 'dou',
    externalId: 'ext-1',
    url: 'https://jobs.dou.ua/1',
    title: 'Senior Python Developer',
    company: 'Acme',
    descriptionMd: 'Build backend services in Python.',
    summary: null,
    tags: [],
    redFlags: [],
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    seniority: 'senior',
    remote: 'remote',
    location: 'Kyiv',
    postedAt: null,
    firstSeenAt: new Date('2026-07-15T00:00:00Z'),
    lastSeenAt: new Date('2026-07-15T00:00:00Z'),
    status: 'processed',
    matchScore: 91,
    currentReaction: null,
    ...overrides,
  };
}

/**
 * Minimal {@link ProfileRepository} fake with a single switchable active
 * profile.
 */
class FakeProfileRepository implements ProfileRepository {
  public active: Profile | null = {
    id: 1,
    name: 'default',
    cvMd: 'Backend dev.',
    skills: [],
    preferences: {},
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
  };

  public findAll(): Promise<readonly Profile[]> {
    return Promise.resolve(this.active === null ? [] : [this.active]);
  }

  public findActive(): Promise<Profile | null> {
    return Promise.resolve(this.active);
  }

  public findById(): Promise<Profile | null> {
    return Promise.resolve(this.active);
  }

  public create(input: CreateProfileInput): Promise<Profile> {
    throw new Error(`Not implemented in fake: create(${JSON.stringify(input)})`);
  }

  public update(id: number, input: UpdateProfileInput): Promise<Profile | null> {
    throw new Error(`Not implemented in fake: update(${id.toString()}, ${JSON.stringify(input)})`);
  }

  public delete(id: number): Promise<boolean> {
    throw new Error(`Not implemented in fake: delete(${id.toString()})`);
  }
}

describe('CoverLettersService', () => {
  let letters: FakeCoverLetterRepository;
  let profiles: FakeProfileRepository;
  let jobs: FakeJobRepository;
  let llm: FakeLlmCoverLetterClient;
  let service: CoverLettersService;

  beforeEach(() => {
    letters = new FakeCoverLetterRepository();
    profiles = new FakeProfileRepository();
    jobs = new FakeJobRepository();
    llm = new FakeLlmCoverLetterClient();
    service = new CoverLettersService(letters, profiles, jobs, llm);
  });

  it('returns the draft for the active profile', async () => {
    await letters.saveEdited(42n, 1, 'Dear hiring manager...');

    const draft = await service.get(42n);

    expect(draft.bodyMd).toBe('Dear hiring manager...');
    expect(draft.edited).toBe(true);
  });

  it('throws NotFoundException when no draft exists', async () => {
    await expect(service.get(99n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when no active profile exists', async () => {
    profiles.active = null;

    await expect(service.get(1n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('saves an edited draft body and marks it edited', async () => {
    const saved = await service.save(7n, 'Updated letter body');

    expect(saved.bodyMd).toBe('Updated letter body');
    expect(saved.edited).toBe(true);
    expect(letters.letters).toHaveLength(1);
  });

  it('upserts onto an existing draft rather than duplicating it', async () => {
    await service.save(7n, 'First draft');
    await service.save(7n, 'Second draft');

    expect(letters.letters).toHaveLength(1);
    expect(letters.letters[0]?.bodyMd).toBe('Second draft');
  });

  describe('regenerate', () => {
    it('generates and persists a fresh draft (edited = false)', async () => {
      jobs.job = makeJob();

      const draft = await service.regenerate(42n);

      expect(draft.bodyMd).toBe('Generated cover letter body.');
      expect(draft.edited).toBe(false);
      expect(llm.calls).toHaveLength(1);
      expect(llm.calls[0]?.job.title).toBe('Senior Python Developer');
      expect(llm.calls[0]?.job.remote).toBe(true);
      expect(llm.calls[0]?.profile.summary).toBe('Backend dev.');
    });

    it('overwrites a previously edited draft with the fresh generation', async () => {
      jobs.job = makeJob();
      await letters.saveEdited(42n, 1, 'Manually edited body');

      const draft = await service.regenerate(42n);

      expect(draft.bodyMd).toBe('Generated cover letter body.');
      expect(draft.edited).toBe(false);
      expect(letters.letters).toHaveLength(1);
    });

    it('throws NotFoundException when the job does not exist', async () => {
      jobs.job = null;

      await expect(service.regenerate(999n)).rejects.toBeInstanceOf(NotFoundException);
      expect(llm.calls).toHaveLength(0);
    });

    it('throws NotFoundException when the job has no persisted match', async () => {
      jobs.job = makeJob({ matchScore: null });

      await expect(service.regenerate(42n)).rejects.toBeInstanceOf(NotFoundException);
      expect(llm.calls).toHaveLength(0);
    });

    it('throws NotFoundException when no active profile exists', async () => {
      profiles.active = null;

      await expect(service.regenerate(42n)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('maps a 503 LLM failure to ServiceUnavailableException', async () => {
      jobs.job = makeJob();
      llm.failure = new LlmUpstreamError(503, 'no active provider');

      await expect(service.regenerate(42n)).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('maps any other LLM failure to BadGatewayException', async () => {
      jobs.job = makeJob();
      llm.failure = new LlmUpstreamError(502, 'schema validation failed');

      await expect(service.regenerate(42n)).rejects.toBeInstanceOf(BadGatewayException);
    });
  });
});
