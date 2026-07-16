/**
 * @module source.model
 *
 * Job source entity from `core.sources`. The gateway reads source metadata and
 * delegates scrape triggers to the scraper service.
 */

/** Allowed fetch strategy values. */
export type FetchStrategy = 'api' | 'crawl4ai' | 'agent-browser';

/**
 * Job source read model.
 */
export interface Source {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly enabled: boolean;
  readonly fetchStrategy: FetchStrategy;
  /** Source-specific configuration (search queries, subreddits, rate limits). */
  readonly config: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
