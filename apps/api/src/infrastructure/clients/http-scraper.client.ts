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
  ScrapeTriggerResponse,
  ScraperClient,
} from '../../application/ports/scraper-client.port';

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

  /** @inheritdoc */
  public async triggerScrape(slug: string): Promise<ScrapeTriggerResponse> {
    const baseUrl = this.config.get<ApiConfig['SCRAPER_BASE_URL']>('api.SCRAPER_BASE_URL');
    const token = this.config.get<ApiConfig['INTERNAL_API_TOKEN']>('api.INTERNAL_API_TOKEN');
    if (!baseUrl || !token) {
      throw new Error('Scraper client misconfiguration: missing base URL or token');
    }

    const response = await fetch(`${baseUrl}/scrape/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': token,
      },
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
}
