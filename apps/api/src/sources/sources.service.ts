/**
 * @module sources.service
 *
 * Application service for source administration and scrape run history.
 */
import {
  BadGatewayException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ScrapeRun } from '../domain/scrape-run.model';
import type { Source } from '../domain/source.model';
import {
  SCRAPER_CLIENT,
  type ScraperClient,
  type SourceTestResult,
} from '../application/ports/scraper-client.port';
import {
  SOURCE_REPOSITORY,
  type CreateSourceInput,
  type SourceRepository,
  type UpdateSourceInput,
} from '../application/ports/source-repository.port';

/**
 * Application service for sources.
 */
@Injectable()
export class SourcesService {
  /**
   * Application service for sources.
   *
   * @param repository - Source repository port.
   * @param scraper - Scraper client port.
   */
  public constructor(
    @Inject(SOURCE_REPOSITORY)
    private readonly repository: SourceRepository,
    @Inject(SCRAPER_CLIENT)
    private readonly scraper: ScraperClient,
  ) {}

  /**
   * List all sources.
   */
  public async list(): Promise<readonly Source[]> {
    return this.repository.findAll();
  }

  /**
   * Get a source by slug.
   *
   * @param slug - Source slug.
   * @throws NotFoundException when not found.
   */
  public async get(slug: string): Promise<Source> {
    const source = await this.repository.findBySlug(slug);
    if (source === null) {
      throw new NotFoundException(`Source ${slug} not found`);
    }
    return source;
  }

  /**
   * Create a source.
   *
   * @param input - New source data.
   * @throws ConflictException when the slug already exists.
   */
  public async create(input: CreateSourceInput): Promise<Source> {
    const source = await this.repository.create(input);
    if (source === null) {
      throw new ConflictException(`Source slug '${input.slug}' already exists`);
    }
    return source;
  }

  /**
   * Update a source's fields (slug excluded — immutable).
   *
   * @param slug - Source slug.
   * @param patch - Fields to change.
   * @throws NotFoundException when not found.
   */
  public async update(slug: string, patch: UpdateSourceInput): Promise<Source> {
    const source = await this.repository.update(slug, patch);
    if (source === null) {
      throw new NotFoundException(`Source ${slug} not found`);
    }
    return source;
  }

  /**
   * Enable or disable a source.
   *
   * @param slug - Source slug.
   * @param enabled - New enabled state.
   * @throws NotFoundException when not found.
   */
  public async setEnabled(slug: string, enabled: boolean): Promise<Source> {
    const source = await this.repository.setEnabled(slug, enabled);
    if (source === null) {
      throw new NotFoundException(`Source ${slug} not found`);
    }
    return source;
  }

  /**
   * Trigger a scrape run for a source.
   *
   * @param slug - Source slug.
   * @returns Accepted run summary.
   * @throws NotFoundException when not found.
   */
  public async triggerScrape(slug: string): Promise<ScrapeRun> {
    const source = await this.get(slug);
    const response = await this.scraper.triggerScrape(source.slug);
    return {
      id: response.runId,
      sourceId: source.id,
      sourceSlug: source.slug,
      startedAt: new Date(),
      finishedAt: null,
      status: 'running',
      stats: {},
      error: null,
    };
  }

  /**
   * Get scrape run history for a source.
   *
   * @param sourceId - Source id.
   * @param limit - Page size.
   * @param offset - Page offset.
   */
  public async runs(
    sourceId: number,
    limit: number,
    offset: number,
  ): Promise<readonly ScrapeRun[]> {
    return this.repository.findRuns(sourceId, limit, offset);
  }

  /**
   * Test connectivity for a source without persisting anything.
   *
   * @param slug - Source slug.
   * @throws NotFoundException when the slug is unknown to the gateway.
   * @throws BadGatewayException when the scraper service is unreachable.
   */
  public async test(slug: string): Promise<SourceTestResult> {
    await this.get(slug);
    try {
      return await this.scraper.testSource(slug);
    } catch (error) {
      throw new BadGatewayException(
        error instanceof Error ? error.message : 'Scraper service unreachable',
      );
    }
  }

  /**
   * List source slugs with a registered scraper adapter.
   */
  public async adapters(): Promise<readonly string[]> {
    return this.scraper.listAdapters();
  }
}
