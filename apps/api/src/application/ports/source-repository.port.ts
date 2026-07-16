/**
 * @module source-repository.port
 *
 * Port for reading job sources and toggling their enabled flag. Scrape run
 * history is read-only from `scraper.scrape_runs`.
 */
import type { ScrapeRun } from '../../domain/scrape-run.model';
import type { Source } from '../../domain/source.model';

/**
 * Repository contract for sources.
 */
export interface SourceRepository {
  /**
   * List all sources.
   */
  findAll(): Promise<readonly Source[]>;

  /**
   * Find a source by slug.
   *
   * @param slug - Source slug.
   */
  findBySlug(slug: string): Promise<Source | null>;

  /**
   * Enable or disable a source.
   *
   * @param slug - Source slug.
   * @param enabled - New enabled state.
   * @returns Updated source or `null`.
   */
  setEnabled(slug: string, enabled: boolean): Promise<Source | null>;

  /**
   * Paginated scrape run history for a source.
   *
   * @param sourceId - Source id.
   * @param limit - Page size.
   * @param offset - Page offset.
   */
  findRuns(sourceId: number, limit: number, offset: number): Promise<readonly ScrapeRun[]>;
}

/**
 * Injection token for the source repository port.
 */
export const SOURCE_REPOSITORY = Symbol('SOURCE_REPOSITORY');
