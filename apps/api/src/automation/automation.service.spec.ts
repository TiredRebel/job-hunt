/**
 * @module automation.service.spec
 *
 * Unit tests for {@link AutomationService} using in-memory repository,
 * profile, and scraper-client fakes.
 */
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Profile } from '../domain/profile.model';
import type {
  AutomationRepository,
  DigestPayload,
  NotificationChannel,
  PersistJobResultInput,
  PersistJobResultOutput,
  UnnotifiedMatch,
} from '../application/ports/automation-repository.port';
import type {
  CreateProfileInput,
  ProfileRepository,
  UpdateProfileInput,
} from '../application/ports/profile-repository.port';
import type {
  DeadLetterJob,
  RawJob,
  RawJobOutcome,
  ScrapeTriggerResponse,
  ScraperClient,
  SourceTestResult,
} from '../application/ports/scraper-client.port';
import type { JobResultDto } from './automation.dto';
import { AutomationService } from './automation.service';

/**
 * In-memory {@link AutomationRepository} fake.
 */
class FakeAutomationRepository implements AutomationRepository {
  public persisted: PersistJobResultInput[] = [];
  public unnotified: UnnotifiedMatch[] = [];
  public digestPayload: DigestPayload = { since: null, newJobs: [], newMatches: [] };
  public digestSentCount = 0;
  private readonly notified = new Set<string>();
  private nextJobId = 100n;

  public persistJobResult(input: PersistJobResultInput): Promise<PersistJobResultOutput> {
    this.persisted.push(input);
    const jobId = this.nextJobId;
    this.nextJobId += 1n;
    return Promise.resolve({ jobId });
  }

  public findUnnotifiedMatches(): Promise<readonly UnnotifiedMatch[]> {
    return Promise.resolve(this.unnotified);
  }

  public recordNotification(jobMatchId: bigint, channel: NotificationChannel): Promise<boolean> {
    const key = `${jobMatchId.toString()}:${channel}`;
    if (this.notified.has(key)) {
      return Promise.resolve(false);
    }
    this.notified.add(key);
    return Promise.resolve(true);
  }

  public digest(): Promise<DigestPayload> {
    return Promise.resolve(this.digestPayload);
  }

  public markDigestSent(): Promise<Date> {
    this.digestSentCount += 1;
    return Promise.resolve(new Date('2026-07-16T12:00:00Z'));
  }
}

/**
 * Minimal {@link ProfileRepository} fake with a single switchable active
 * profile.
 */
class FakeProfileRepository implements ProfileRepository {
  public active: Profile | null = {
    id: 1,
    name: 'default',
    cvMd: 'Backend developer, 8y Python.',
    skills: ['python', 'postgresql'],
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

/**
 * In-memory {@link ScraperClient} fake covering only the automation-relevant
 * methods.
 */
class FakeScraperClient implements ScraperClient {
  public rawJobs: RawJob[] = [];
  public markedProcessed: Array<{ rawJobId: number; outcome: RawJobOutcome }> = [];
  public markProcessedResult = true;
  public deadLetterJobs: DeadLetterJob[] = [];

  public triggerScrape(): Promise<ScrapeTriggerResponse> {
    throw new Error('Not implemented in fake');
  }

  public listUnprocessed(limit: number): Promise<readonly RawJob[]> {
    return Promise.resolve(this.rawJobs.slice(0, limit));
  }

  public markProcessed(rawJobId: number, outcome: RawJobOutcome): Promise<boolean> {
    this.markedProcessed.push({ rawJobId, outcome });
    return Promise.resolve(this.markProcessedResult);
  }

  public listAdapters(): Promise<readonly string[]> {
    throw new Error('Not implemented in fake');
  }

  public testSource(): Promise<SourceTestResult> {
    throw new Error('Not implemented in fake');
  }

  public listDeadLetter(limit: number): Promise<readonly DeadLetterJob[]> {
    return Promise.resolve(this.deadLetterJobs.slice(0, limit));
  }
}

function makeRawJob(overrides: Partial<RawJob> = {}): RawJob {
  return {
    id: 1,
    sourceId: 1,
    sourceSlug: 'dou',
    externalId: 'ext-1',
    url: 'https://jobs.dou.ua/1',
    title: 'Senior Python Developer',
    rawHtml: '<html>...</html>',
    fetchedAt: new Date('2026-07-16T09:00:00Z'),
    processAttempts: 0,
    ...overrides,
  };
}

function processedResultPayload(overrides: Partial<JobResultDto> = {}): JobResultDto {
  return {
    status: 'processed',
    sourceId: 1,
    externalId: 'ext-1',
    url: 'https://jobs.dou.ua/1',
    normalized: {
      title: 'Senior Python Developer',
      descriptionMd: 'Build backend services.',
    },
    ...overrides,
  } as JobResultDto;
}

describe('AutomationService', () => {
  let repository: FakeAutomationRepository;
  let profiles: FakeProfileRepository;
  let scraper: FakeScraperClient;
  let service: AutomationService;

  beforeEach(() => {
    repository = new FakeAutomationRepository();
    profiles = new FakeProfileRepository();
    scraper = new FakeScraperClient();
    service = new AutomationService(repository, profiles, scraper);
  });

  describe('unprocessedJobs', () => {
    it('maps the active profile and raw jobs', async () => {
      scraper.rawJobs = [makeRawJob()];

      const result = await service.unprocessedJobs(20);

      expect(result.profile).toEqual({
        summary: 'Backend developer, 8y Python.',
        skills: ['python', 'postgresql'],
        preferences: null,
      });
      expect(result.jobs).toEqual([
        {
          rawJobId: 1,
          sourceId: 1,
          externalId: 'ext-1',
          url: 'https://jobs.dou.ua/1',
          title: 'Senior Python Developer',
          body: '<html>...</html>',
        },
      ]);
    });

    it('serializes non-empty preferences as JSON', async () => {
      profiles.active = {
        ...(profiles.active as Profile),
        preferences: { remote: ['remote'], seniorities: ['senior'] },
      };

      const result = await service.unprocessedJobs(20);

      expect(result.profile.preferences).toBe(
        JSON.stringify({ remote: ['remote'], seniorities: ['senior'] }),
      );
    });

    it('throws NotFoundException when no active profile exists', async () => {
      profiles.active = null;

      await expect(service.unprocessedJobs(20)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deadLetterJobs', () => {
    it('passes through the scraper client dead-letter listing', async () => {
      const job: DeadLetterJob = {
        id: 2,
        sourceId: 1,
        sourceSlug: 'dou',
        externalId: 'ext-2',
        url: 'https://jobs.dou.ua/2',
        title: 'Backend Engineer',
        processAttempts: 3,
        processedAt: new Date('2026-07-16T10:00:00Z'),
      };
      scraper.deadLetterJobs = [job];

      const result = await service.deadLetterJobs(50);

      expect(result).toEqual([job]);
    });

    it('respects the limit', async () => {
      scraper.deadLetterJobs = [makeRawJob(), makeRawJob({ id: 2 })].map((row) => ({
        id: row.id,
        sourceId: row.sourceId,
        sourceSlug: 'dou',
        externalId: row.externalId,
        url: row.url,
        title: row.title,
        processAttempts: row.processAttempts,
        processedAt: null,
      }));

      const result = await service.deadLetterJobs(1);

      expect(result).toHaveLength(1);
    });
  });

  describe('persistResult', () => {
    it('marks the raw job failed without touching core.* when status is failed', async () => {
      const ack = await service.persistResult(1, { status: 'failed' });

      expect(ack).toEqual({ status: 'failed', jobId: null });
      expect(repository.persisted).toHaveLength(0);
      expect(scraper.markedProcessed).toEqual([{ rawJobId: 1, outcome: 'failed' }]);
    });

    it('throws NotFoundException when marking failed on an unknown raw job', async () => {
      scraper.markProcessedResult = false;

      await expect(service.persistResult(999, { status: 'failed' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when processed but missing required fields', async () => {
      await expect(
        service.persistResult(1, { status: 'processed' } as JobResultDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists the job, match and cover letter, then marks the raw job done', async () => {
      const ack = await service.persistResult(
        1,
        processedResultPayload({
          match: { score: 91, explanation: 'strong fit', modelUsed: 'ollama-local/qwen3:14b' },
          coverLetter: { bodyMd: 'Dear hiring manager...', modelUsed: 'ollama-local/qwen3:32b' },
        }),
      );

      expect(ack.status).toBe('processed');
      expect(ack.jobId).toBe(100n);
      expect(repository.persisted).toHaveLength(1);
      const persisted = repository.persisted[0];
      expect(persisted?.rawJobId).toBe(1);
      expect(persisted?.profileId).toBe(1);
      expect(persisted?.match?.score).toBe(91);
      expect(persisted?.coverLetter?.bodyMd).toBe('Dear hiring manager...');
      expect(scraper.markedProcessed).toEqual([{ rawJobId: 1, outcome: 'done' }]);
    });

    it('persists without a match or cover letter when the profile did not match', async () => {
      await service.persistResult(1, processedResultPayload());

      expect(repository.persisted[0]?.match).toBeNull();
      expect(repository.persisted[0]?.coverLetter).toBeNull();
    });

    it('throws NotFoundException when marking done on an unknown raw job', async () => {
      scraper.markProcessedResult = false;

      await expect(service.persistResult(999, processedResultPayload())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('unnotifiedMatches', () => {
    it('delegates to the repository', async () => {
      repository.unnotified = [
        {
          jobMatchId: 17n,
          jobId: 42n,
          jobTitle: 'Senior Python Developer',
          company: 'Acme',
          url: 'https://jobs.dou.ua/1',
          score: 91,
          explanation: 'strong fit',
        },
      ];

      const result = await service.unnotifiedMatches('telegram');

      expect(result).toEqual(repository.unnotified);
    });
  });

  describe('recordNotification', () => {
    it('records a new notification', async () => {
      await expect(service.recordNotification(17n, 'telegram')).resolves.toBeUndefined();
    });

    it('throws ConflictException on a duplicate', async () => {
      await service.recordNotification(17n, 'telegram');

      await expect(service.recordNotification(17n, 'telegram')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('digest', () => {
    it('delegates to the repository', async () => {
      repository.digestPayload = {
        since: new Date('2026-07-15T08:00:00Z'),
        newJobs: [
          {
            jobId: 42n,
            title: 'Senior Python Developer',
            sourceSlug: 'dou',
            firstSeenAt: new Date(),
          },
        ],
        newMatches: [],
      };

      const result = await service.digest();

      expect(result).toEqual(repository.digestPayload);
    });
  });

  describe('markDigestSent', () => {
    it('delegates to the repository and returns the new watermark', async () => {
      const result = await service.markDigestSent();

      expect(result).toEqual(new Date('2026-07-16T12:00:00Z'));
      expect(repository.digestSentCount).toBe(1);
    });
  });
});
