/**
 * @module scrape-run.model
 *
 * Scrape run entity from `scraper.scrape_runs`. Read-only summary in the
 * gateway; orchestration lives in the scraper service.
 */

/** Allowed scrape run status values. */
export type ScrapeRunStatus = 'running' | 'success' | 'partial' | 'failed';

/**
 * Scrape run summary.
 */
export interface ScrapeRun {
  readonly id: bigint;
  readonly sourceId: number;
  readonly sourceSlug: string;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
  readonly status: ScrapeRunStatus;
  /** Run statistics: found, new, updated, errors. */
  readonly stats: Record<string, number>;
  readonly error: string | null;
}
