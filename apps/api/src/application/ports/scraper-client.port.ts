/**
 * @module scraper-client.port
 *
 * Outbound port for triggering scrape runs and reading/marking raw jobs on
 * the scraper service. The gateway never queries `scraper.*` tables
 * directly (see docs/ARCHITECTURE.md §3) — the processing-chain feed goes
 * through this port instead.
 */

/**
 * Response from a scrape trigger call.
 */
export interface ScrapeTriggerResponse {
  readonly runId: bigint;
  readonly status: string;
}

/**
 * A raw job awaiting LLM processing, as returned by the scraper service.
 */
export interface RawJob {
  readonly id: number;
  readonly sourceId: number;
  readonly sourceSlug: string;
  readonly externalId: string;
  readonly url: string;
  readonly title: string;
  readonly rawHtml: string;
  readonly fetchedAt: Date;
  readonly processAttempts: number;
}

/**
 * Outcome recorded for one processing attempt on a raw job.
 */
export type RawJobOutcome = 'done' | 'failed';

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

  /**
   * List raw jobs awaiting LLM processing, oldest first.
   *
   * @param limit - Maximum rows to return.
   */
  listUnprocessed(limit: number): Promise<readonly RawJob[]>;

  /**
   * Record the outcome of one processing attempt for a raw job.
   *
   * @param rawJobId - `scraper.jobs_raw.id`.
   * @param outcome - Attempt outcome.
   * @returns `true` when the row was found and updated.
   */
  markProcessed(rawJobId: number, outcome: RawJobOutcome): Promise<boolean>;
}

/**
 * Injection token for the scraper client port.
 */
export const SCRAPER_CLIENT = Symbol('SCRAPER_CLIENT');
