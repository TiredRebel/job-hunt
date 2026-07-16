/**
 * @module scraper-client.port
 *
 * Outbound port for triggering scrape runs on the scraper service.
 */

/**
 * Response from a scrape trigger call.
 */
export interface ScrapeTriggerResponse {
  readonly runId: bigint;
  readonly status: string;
}

/**
 * Outbound scraper client contract.
 */
export interface ScraperClient {
  /**
   * Trigger a scrape run for the given source slug.
   *
   * @param slug - Source slug.
   * @returns Accepted run summary.
   */
  triggerScrape(slug: string): Promise<ScrapeTriggerResponse>;
}

/**
 * Injection token for the scraper client port.
 */
export const SCRAPER_CLIENT = Symbol('SCRAPER_CLIENT');
