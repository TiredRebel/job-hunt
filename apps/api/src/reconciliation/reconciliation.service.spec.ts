/**
 * @module reconciliation.service.spec
 *
 * Unit tests for {@link ReconciliationService} using an in-memory repository
 * fake following the existing `*.service.spec.ts` pattern.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import type { ReconciliationAggregate, ReconciliationRow } from '../domain/reconciliation.model';
import type { JobsReconciliationRepository } from '../application/ports/jobs-reconciliation.port';
import type {
  DeadLetterJob,
  RawJobOutcome,
  RawJob,
  ScrapeTriggerResponse,
  ScraperClient,
  SourceTestResult,
} from '../application/ports/scraper-client.port';
import { ReconciliationService } from './reconciliation.service';

/**
 * Build a per-source reconciliation row fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Reconciliation row fixture.
 */
function makeRow(overrides: Partial<ReconciliationRow> = {}): ReconciliationRow {
  return {
    sourceId: 1,
    sourceSlug: 'dou',
    rawTotal: 0,
    processed: 0,
    pending: 0,
    failed: 0,
    visibleJobs: 0,
    hiddenJobs: 0,
    ...overrides,
  };
}

/**
 * In-memory {@link JobsReconciliationRepository} fake.
 */
class FakeReconciliationRepository implements JobsReconciliationRepository {
  public rows: ReconciliationRow[] = [];

  public listBySource(): Promise<readonly ReconciliationRow[]> {
    return Promise.resolve(this.rows);
  }

  public aggregate(): Promise<ReconciliationAggregate> {
    const rawTotal = this.rows.reduce((sum, row) => sum + row.rawTotal, 0);
    const processed = this.rows.reduce((sum, row) => sum + row.processed, 0);
    const pending = this.rows.reduce((sum, row) => sum + row.pending, 0);
    const failed = this.rows.reduce((sum, row) => sum + row.failed, 0);
    const visibleJobs = this.rows.reduce((sum, row) => sum + row.visibleJobs, 0);
    const hiddenJobs = this.rows.reduce((sum, row) => sum + row.hiddenJobs, 0);
    return Promise.resolve({
      rawTotal,
      processed,
      pending,
      failed,
      visibleJobs,
      hiddenJobs,
      legacyDelta: processed - (visibleJobs + hiddenJobs),
    });
  }
}

/**
 * In-memory {@link ScraperClient} fake covering only the
 * reconciliation-relevant method (`listDeadLetter`); the others throw.
 */
class FakeScraperClient implements ScraperClient {
  public deadLetter: DeadLetterJob[] = [];
  public lastLimit: number | null = null;

  public triggerScrape(): Promise<ScrapeTriggerResponse> {
    throw new Error('Not implemented in fake');
  }

  public listUnprocessed(): Promise<readonly RawJob[]> {
    throw new Error('Not implemented in fake');
  }

  public markProcessed(_rawJobId: number, _outcome: RawJobOutcome): Promise<boolean> {
    throw new Error('Not implemented in fake');
  }

  public listAdapters(): Promise<readonly string[]> {
    throw new Error('Not implemented in fake');
  }

  public testSource(): Promise<SourceTestResult> {
    throw new Error('Not implemented in fake');
  }

  public listDeadLetter(limit: number): Promise<readonly DeadLetterJob[]> {
    this.lastLimit = limit;
    return Promise.resolve(this.deadLetter);
  }
}

describe('ReconciliationService', () => {
  let repository: FakeReconciliationRepository;
  let scraper: FakeScraperClient;
  let service: ReconciliationService;

  beforeEach(() => {
    repository = new FakeReconciliationRepository();
    scraper = new FakeScraperClient();
    service = new ReconciliationService(repository, scraper);
  });

  it('returns an empty array when there are no sources', async () => {
    repository.rows = [];

    const result = await service.listBySource();

    expect(result).toEqual([]);
  });

  it('returns per-source rows ordered as the repository returns them', async () => {
    repository.rows = [
      makeRow({ sourceId: 1, sourceSlug: 'dou', rawTotal: 10, processed: 7 }),
      makeRow({ sourceId: 2, sourceSlug: 'workua', rawTotal: 5, processed: 4 }),
    ];

    const result = await service.listBySource();

    expect(result).toHaveLength(2);
    expect(result[0]?.sourceSlug).toBe('dou');
    expect(result[1]?.sourceSlug).toBe('workua');
  });

  it('forwards a single source with mixed processing states', async () => {
    repository.rows = [
      makeRow({
        sourceId: 1,
        sourceSlug: 'dou',
        rawTotal: 10,
        processed: 7,
        pending: 2,
        failed: 1,
        visibleJobs: 6,
        hiddenJobs: 1,
      }),
    ];

    const result = await service.listBySource();

    expect(result[0]).toEqual({
      sourceId: 1,
      sourceSlug: 'dou',
      rawTotal: 10,
      processed: 7,
      pending: 2,
      failed: 1,
      visibleJobs: 6,
      hiddenJobs: 1,
    });
  });

  it('aggregates buckets across three sources', async () => {
    repository.rows = [
      makeRow({
        sourceId: 1,
        sourceSlug: 'dou',
        rawTotal: 10,
        processed: 7,
        pending: 2,
        failed: 1,
        visibleJobs: 6,
        hiddenJobs: 1,
      }),
      makeRow({
        sourceId: 2,
        sourceSlug: 'workua',
        rawTotal: 5,
        processed: 4,
        pending: 1,
        failed: 0,
        visibleJobs: 4,
        hiddenJobs: 0,
      }),
      makeRow({
        sourceId: 3,
        sourceSlug: 'djinni',
        rawTotal: 0,
        processed: 0,
        pending: 0,
        failed: 0,
        visibleJobs: 0,
        hiddenJobs: 0,
      }),
    ];

    const aggregate = await service.aggregate();

    expect(aggregate).toEqual({
      rawTotal: 15,
      processed: 11,
      pending: 3,
      failed: 1,
      visibleJobs: 10,
      hiddenJobs: 1,
      legacyDelta: 0,
    });
  });

  it('surfaces a non-zero legacyDelta when core.jobs has rows without a raw parent', async () => {
    repository.rows = [
      makeRow({
        sourceId: 1,
        sourceSlug: 'dou',
        rawTotal: 10,
        processed: 7,
        visibleJobs: 6,
        hiddenJobs: 6,
      }),
    ];

    const aggregate = await service.aggregate();

    expect(aggregate.legacyDelta).toBe(-5);
    expect(aggregate.processed).toBe(7);
    expect(aggregate.visibleJobs + aggregate.hiddenJobs).toBe(12);
  });

  it('returns zero buckets for a source with no scrape runs', async () => {
    repository.rows = [makeRow({ sourceId: 2, sourceSlug: 'djinni' })];

    const result = await service.listBySource();

    expect(result[0]).toEqual({
      sourceId: 2,
      sourceSlug: 'djinni',
      rawTotal: 0,
      processed: 0,
      pending: 0,
      failed: 0,
      visibleJobs: 0,
      hiddenJobs: 0,
    });
  });

  it('deadLetterJobs forwards the limit to the scraper client', async () => {
    scraper.deadLetter = [
      {
        id: 1,
        sourceId: 1,
        sourceSlug: 'dou',
        externalId: 'ext-1',
        url: 'https://example.com/1',
        title: 'Failed job',
        processAttempts: 3,
        processedAt: null,
      } satisfies DeadLetterJob,
    ];

    const result = await service.deadLetterJobs(25);

    expect(result).toHaveLength(1);
    expect(scraper.lastLimit).toBe(25);
  });
});
