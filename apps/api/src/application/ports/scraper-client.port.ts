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

/** Outcome of a source connectivity test. */
export type SourceTestStatus = 'ok' | 'no_adapter' | 'unsupported_strategy' | 'blocked' | 'failed';

/**
 * Result of {@link ScraperClient.testSource}.
 */
export interface SourceTestResult {
  readonly status: SourceTestStatus;
  readonly detail: string;
  readonly httpStatus: number | null;
  readonly elapsedMs: number | null;
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
 * A raw job that gave up after repeated processing failures.
 */
export interface DeadLetterJob {
  readonly id: number;
  readonly sourceId: number;
  readonly sourceSlug: string;
  readonly externalId: string;
  readonly url: string;
  readonly title: string;
  readonly processAttempts: number;
  readonly processedAt: Date | null;
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

  /**
   * List source slugs with a registered scraper adapter.
   */
  listAdapters(): Promise<readonly string[]>;

  /**
   * Test connectivity for one source, without persisting anything.
   *
   * @param slug - Source slug.
   */
  testSource(slug: string): Promise<SourceTestResult>;

  /**
   * List raw jobs that gave up after repeated processing failures.
   *
   * @param limit - Maximum rows to return.
   */
  listDeadLetter(limit: number): Promise<readonly DeadLetterJob[]>;
}

/**
 * Injection token for the scraper client port.
 */
export const SCRAPER_CLIENT = Symbol('SCRAPER_CLIENT');
