/**
 * @module source-repository.port
 *
 * Port for reading job sources and toggling their enabled flag. Scrape run
 * history is read-only from `scraper.scrape_runs`.
 */
import type { ScrapeRun } from '../../domain/scrape-run.model';
import type { FetchStrategy, Source } from '../../domain/source.model';

/**
 * Input accepted by {@link SourceRepository.create}.
 */
export interface CreateSourceInput {
  readonly slug: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly fetchStrategy: FetchStrategy;
  readonly config?: Record<string, unknown>;
  readonly enabled?: boolean;
}

/**
 * Input accepted by {@link SourceRepository.update}. All fields optional —
 * only provided ones are changed. Slug is intentionally absent: it is the
 * adapter-registry key and immutable after creation.
 */
export interface UpdateSourceInput {
  readonly name?: string;
  readonly baseUrl?: string;
  readonly fetchStrategy?: FetchStrategy;
  readonly config?: Record<string, unknown>;
  readonly enabled?: boolean;
}

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
   * Create a source.
   *
   * @param input - New source data.
   * @returns The created source, or `null` if the slug already exists.
   */
  create(input: CreateSourceInput): Promise<Source | null>;

  /**
   * Update a source's fields (slug excluded — immutable).
   *
   * @param slug - Source slug.
   * @param patch - Fields to change.
   * @returns The updated source, or `null` if the slug is unknown.
   */
  update(slug: string, patch: UpdateSourceInput): Promise<Source | null>;

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

  /**
   * Permanently delete a source, guarded against any associated data.
   *
   * @param slug - Source slug.
   * @returns `'deleted'` on success, `'not_found'` for an unknown slug,
   *   `'in_use'` when the source has associated jobs, raw jobs, or scrape
   *   runs (deletion refused, nothing changed).
   */
  delete(slug: string): Promise<'deleted' | 'not_found' | 'in_use'>;
}

/**
 * Injection token for the source repository port.
 */
export const SOURCE_REPOSITORY = Symbol('SOURCE_REPOSITORY');
