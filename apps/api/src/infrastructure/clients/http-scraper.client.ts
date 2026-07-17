/**
 * @module http-scraper.client
 *
 * HTTP implementation of {@link ScraperClient}. Calls `POST /scrape/{slug}` on
 * the scraper service using the shared internal token.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApiConfig } from '../../config/api-config';
import type {
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
    processAttempts: Number(body['process_attempts']),
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
   */
  public constructor(private readonly config: ConfigService) {}

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
    return {
      baseUrl,
      headers: { 'Content-Type': 'application/json', 'X-Internal-Token': token },
    };
  }

  /** @inheritdoc */
  public async triggerScrape(slug: string): Promise<ScrapeTriggerResponse> {
    const { baseUrl, headers } = this.connection();

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

    const response = await fetch(
      `${baseUrl}/jobs_raw/unprocessed?limit=${encodeURIComponent(String(limit))}`,
      { headers },
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

    const response = await fetch(`${baseUrl}/adapters`, { headers });

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as { slugs: string[] };
    return body.slugs;
  }

  /** @inheritdoc */
  public async testSource(slug: string): Promise<SourceTestResult> {
    const { baseUrl, headers } = this.connection();

    const response = await fetch(`${baseUrl}/sources/${encodeURIComponent(slug)}/test`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    return {
      status: body['status'] as SourceTestStatus,
      detail: String(body['detail']),
      httpStatus: (body['http_status'] as number | null | undefined) ?? null,
      elapsedMs: (body['elapsed_ms'] as number | null | undefined) ?? null,
    };
  }
}
