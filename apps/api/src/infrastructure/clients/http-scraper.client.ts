/**
 * @module http-scraper.client
 *
 * HTTP implementation of {@link ScraperClient}. Calls `POST /scrape/{slug}` on
 * the scraper service using the shared internal token.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'nestjs-pino';

import type { ApiConfig } from '../../config/api-config';
import { CORRELATION_ID_HEADER, type AppClsStore } from '../logger/correlation-id';
import { fetchWithRetry } from './fetch-with-retry';
import type {
  DeadLetterJob,
  RawJob,
  RawJobOutcome,
  ScrapeTriggerResponse,
  ScraperClient,
  SourceTestResult,
  SourceTestStatus,
} from '../../application/ports/scraper-client.port';

function mapRawJob(body: Record<string, unknown>): RawJob {
  return {
    id: Number(body['id']),
    sourceId: Number(body['source_id']),
    sourceSlug: String(body['source_slug']),
    externalId: String(body['external_id']),
    url: String(body['url']),
    title: String(body['title']),
    rawHtml: String(body['raw_html']),
    fetchedAt: new Date(body['fetched_at'] as string),
    postedAt: typeof body['posted_at'] === 'string' ? new Date(body['posted_at']) : null,
    processAttempts: Number(body['process_attempts']),
  };
}

function mapDeadLetterJob(body: Record<string, unknown>): DeadLetterJob {
  return {
    id: Number(body['id']),
    sourceId: Number(body['source_id']),
    sourceSlug: String(body['source_slug']),
    externalId: String(body['external_id']),
    url: String(body['url']),
    title: String(body['title']),
    processAttempts: Number(body['process_attempts']),
    processedAt: typeof body['processed_at'] === 'string' ? new Date(body['processed_at']) : null,
  };
}

/**
 * HTTP client for the scraper service.
 */
@Injectable()
export class HttpScraperClient implements ScraperClient {
  /**
   * HTTP client for the scraper service.
   *
   * @param config - NestJS config service.
   * @param cls - Request-scoped CLS store carrying the correlation id.
   * @param logger - Request-context-aware logger (retry warnings).
   */
  public constructor(
    private readonly config: ConfigService,
    private readonly cls: ClsService<AppClsStore>,
    private readonly logger: Logger,
  ) {}

  /**
   * Base URL + headers, validated once per call.
   *
   * @returns Tuple of base URL and request headers.
   */
  private connection(): { baseUrl: string; headers: Record<string, string> } {
    const baseUrl = this.config.get<ApiConfig['SCRAPER_BASE_URL']>('api.SCRAPER_BASE_URL');
    const token = this.config.get<ApiConfig['INTERNAL_API_TOKEN']>('api.INTERNAL_API_TOKEN');
    if (!baseUrl || !token) {
      throw new Error('Scraper client misconfiguration: missing base URL or token');
    }
    const correlationId = this.cls.get('correlationId');
    return {
      baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': token,
        ...(correlationId !== undefined ? { [CORRELATION_ID_HEADER]: correlationId } : {}),
      },
    };
  }

  /**
   * Retry attempts for safe/idempotent calls, from config.
   *
   * @returns The configured `DOWNSTREAM_RETRY_ATTEMPTS`, default 3.
   */
  private get maxAttempts(): number {
    return (
      this.config.get<ApiConfig['DOWNSTREAM_RETRY_ATTEMPTS']>('api.DOWNSTREAM_RETRY_ATTEMPTS') ?? 3
    );
  }

  /** @inheritdoc */
  public async triggerScrape(slug: string): Promise<ScrapeTriggerResponse> {
    const { baseUrl, headers } = this.connection();

    // Not retried: a run row may already exist server-side even if the
    // response is lost to a network error, and retrying could trigger a
    // second scrape run for one logical request (design.md D6).
    const response = await fetch(`${baseUrl}/scrape/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    return {
      runId: BigInt(body['runId'] as number | string),
      status: String(body['status']),
    };
  }

  /** @inheritdoc */
  public async listUnprocessed(limit: number): Promise<readonly RawJob[]> {
    const { baseUrl, headers } = this.connection();

    const response = await fetchWithRetry(
      `${baseUrl}/jobs_raw/unprocessed?limit=${encodeURIComponent(String(limit))}`,
      { headers },
      {
        maxAttempts: this.maxAttempts,
        target: 'scraper GET /jobs_raw/unprocessed',
        logger: this.logger,
      },
    );

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as Array<Record<string, unknown>>;
    return body.map(mapRawJob);
  }

  /** @inheritdoc */
  public async markProcessed(rawJobId: number, outcome: RawJobOutcome): Promise<boolean> {
    const { baseUrl, headers } = this.connection();

    // Not retried: process_attempts increments server-side on each call, so
    // a blind retry after a lost response could double-count one failure.
    const response = await fetch(`${baseUrl}/jobs_raw/${rawJobId}/mark`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status: outcome }),
    });

    if (response.status === 404) {
      return false;
    }
    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }
    return true;
  }

  /** @inheritdoc */
  public async listAdapters(): Promise<readonly string[]> {
    const { baseUrl, headers } = this.connection();

    const response = await fetchWithRetry(
      `${baseUrl}/adapters`,
      { headers },
      { maxAttempts: this.maxAttempts, target: 'scraper GET /adapters', logger: this.logger },
    );

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as { slugs: string[] };
    return body.slugs;
  }

  /** @inheritdoc */
  public async testSource(slug: string): Promise<SourceTestResult> {
    const { baseUrl, headers } = this.connection();

    // Safe to retry: the scraper's /sources/{slug}/test route is documented
    // side-effect-free (no run row, no raw job writes).
    const response = await fetchWithRetry(
      `${baseUrl}/sources/${encodeURIComponent(slug)}/test`,
      { method: 'POST', headers },
      {
        maxAttempts: this.maxAttempts,
        target: 'scraper POST /sources/{slug}/test',
        logger: this.logger,
      },
    );

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    return {
      status: typeof body['status'] === 'string' ? (body['status'] as SourceTestStatus) : 'failed',
      detail: typeof body['detail'] === 'string' ? body['detail'] : '',
      httpStatus: typeof body['http_status'] === 'number' ? body['http_status'] : null,
      elapsedMs: typeof body['elapsed_ms'] === 'number' ? body['elapsed_ms'] : null,
    };
  }

  /** @inheritdoc */
  public async listDeadLetter(limit: number): Promise<readonly DeadLetterJob[]> {
    const { baseUrl, headers } = this.connection();

    const response = await fetchWithRetry(
      `${baseUrl}/jobs_raw/dead-letter?limit=${encodeURIComponent(String(limit))}`,
      { headers },
      {
        maxAttempts: this.maxAttempts,
        target: 'scraper GET /jobs_raw/dead-letter',
        logger: this.logger,
      },
    );

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as Array<Record<string, unknown>>;
    return body.map(mapDeadLetterJob);
  }
}
