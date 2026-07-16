/**
 * @module sources.service.spec
 *
 * Unit tests for {@link SourcesService} using in-memory repository and scraper
 * client fakes.
 */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ScrapeRun } from '../domain/scrape-run.model';
import type { Source } from '../domain/source.model';
import type {
  RawJob,
  ScrapeTriggerResponse,
  ScraperClient,
} from '../application/ports/scraper-client.port';
import type { SourceRepository } from '../application/ports/source-repository.port';
import { SourcesService } from './sources.service';

/**
 * Build a source fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Source fixture.
 */
function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 1,
    slug: 'dou',
    name: 'DOU',
    baseUrl: 'https://jobs.dou.ua',
    enabled: true,
    fetchStrategy: 'api',
    config: {},
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Build a scrape run fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Scrape run fixture.
 */
function makeRun(overrides: Partial<ScrapeRun> = {}): ScrapeRun {
  return {
    id: 1n,
    sourceId: 1,
    sourceSlug: 'dou',
    startedAt: new Date('2026-07-15T00:00:00Z'),
    finishedAt: new Date('2026-07-15T00:05:00Z'),
    status: 'success',
    stats: { found: 10, new: 3 },
    error: null,
    ...overrides,
  };
}

/**
 * In-memory {@link SourceRepository} fake.
 */
class FakeSourceRepository implements SourceRepository {
  public sources: Source[] = [];
  public scrapeRuns: ScrapeRun[] = [];

  public findAll(): Promise<readonly Source[]> {
    return Promise.resolve(this.sources);
  }

  public findBySlug(slug: string): Promise<Source | null> {
    return Promise.resolve(this.sources.find((source) => source.slug === slug) ?? null);
  }

  public setEnabled(slug: string, enabled: boolean): Promise<Source | null> {
    const index = this.sources.findIndex((source) => source.slug === slug);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const updated = makeSource({ ...this.sources[index], enabled });
    this.sources[index] = updated;
    return Promise.resolve(updated);
  }

  public findRuns(sourceId: number, limit: number, offset: number): Promise<readonly ScrapeRun[]> {
    return Promise.resolve(
      this.scrapeRuns.filter((run) => run.sourceId === sourceId).slice(offset, offset + limit),
    );
  }
}

/**
 * Recording {@link ScraperClient} fake.
 */
class FakeScraperClient implements ScraperClient {
  public triggered: string[] = [];

  public triggerScrape(slug: string): Promise<ScrapeTriggerResponse> {
    this.triggered.push(slug);
    return Promise.resolve({ runId: 42n, status: 'running' });
  }

  public listUnprocessed(): Promise<readonly RawJob[]> {
    return Promise.resolve([]);
  }

  public markProcessed(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('SourcesService', () => {
  let repository: FakeSourceRepository;
  let scraper: FakeScraperClient;
  let service: SourcesService;

  beforeEach(() => {
    repository = new FakeSourceRepository();
    scraper = new FakeScraperClient();
    service = new SourcesService(repository, scraper);
  });

  it('lists all sources', async () => {
    repository.sources = [makeSource(), makeSource({ id: 2, slug: 'work-ua' })];

    const result = await service.list();

    expect(result).toHaveLength(2);
  });

  it('gets a source by slug', async () => {
    repository.sources = [makeSource()];

    const source = await service.get('dou');

    expect(source.name).toBe('DOU');
  });

  it('throws NotFoundException for a missing source', async () => {
    await expect(service.get('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('toggles the enabled flag', async () => {
    repository.sources = [makeSource({ enabled: true })];

    const source = await service.setEnabled('dou', false);

    expect(source.enabled).toBe(false);
  });

  it('throws NotFoundException when toggling a missing source', async () => {
    await expect(service.setEnabled('nope', true)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('triggers a scrape and maps the accepted run', async () => {
    repository.sources = [makeSource()];

    const run = await service.triggerScrape('dou');

    expect(scraper.triggered).toEqual(['dou']);
    expect(run.id).toBe(42n);
    expect(run.sourceSlug).toBe('dou');
    expect(run.status).toBe('running');
    expect(run.finishedAt).toBeNull();
  });

  it('does not call the scraper when the source is missing', async () => {
    await expect(service.triggerScrape('nope')).rejects.toBeInstanceOf(NotFoundException);
    expect(scraper.triggered).toHaveLength(0);
  });

  it('returns paginated scrape runs', async () => {
    repository.scrapeRuns = [
      makeRun({ id: 1n }),
      makeRun({ id: 2n }),
      makeRun({ id: 3n }),
      makeRun({ id: 9n, sourceId: 2 }),
    ];

    const runs = await service.runs(1, 2, 1);

    expect(runs.map((run) => run.id)).toEqual([2n, 3n]);
  });
});
