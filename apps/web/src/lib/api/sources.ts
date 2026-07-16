/**
 * @module lib/api/sources
 *
 * Typed functions for the `/sources` resource, keyed by `slug`.
 */
import { apiRequest } from './client';
import type { OperationResponse } from './types';

/** A scraper source, as returned by the API. */
export type Source = OperationResponse<'SourcesController_get_v1'>;

/** A single scrape run record. */
export type ScrapeRun = OperationResponse<'SourcesController_triggerScrape_v1', 201>;

/** Pagination params accepted by {@link getSourceRuns}. */
export interface SourceRunsParams {
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

/**
 * List all sources.
 *
 * @param signal - Optional abort signal.
 * @returns All configured sources.
 */
export async function listSources(signal?: AbortSignal): Promise<readonly Source[]> {
  return apiRequest<readonly Source[]>('/sources', { signal });
}

/**
 * Get a source by slug.
 *
 * @param slug - Source slug.
 * @param signal - Optional abort signal.
 * @returns The source.
 */
export async function getSource(slug: string, signal?: AbortSignal): Promise<Source> {
  return apiRequest<Source>(`/sources/${slug}`, { signal });
}

/**
 * Enable or disable a source.
 *
 * @param slug - Source slug.
 * @param enabled - New enabled state.
 * @returns The updated source.
 */
export async function setSourceEnabled(slug: string, enabled: boolean): Promise<Source> {
  return apiRequest<Source>(`/sources/${slug}/enabled`, { method: 'PATCH', body: { enabled } });
}

/**
 * Trigger a scrape run for a source.
 *
 * @param slug - Source slug.
 * @returns The created scrape run record.
 */
export async function triggerScrape(slug: string): Promise<ScrapeRun> {
  return apiRequest<ScrapeRun>(`/sources/${slug}/scrape`, { method: 'POST' });
}

/**
 * Get scrape run history for a source.
 *
 * @param slug - Source slug.
 * @param params - Pagination.
 * @param signal - Optional abort signal.
 * @returns The matching scrape runs.
 */
export async function getSourceRuns(
  slug: string,
  params: SourceRunsParams = {},
  signal?: AbortSignal,
): Promise<readonly ScrapeRun[]> {
  return apiRequest<readonly ScrapeRun[]>(`/sources/${slug}/runs`, {
    query: { ...params },
    signal,
  });
}
