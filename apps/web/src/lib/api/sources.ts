/**
 * @module lib/api/sources
 *
 * Typed functions for the `/sources` resource, keyed by `slug`.
 */
import { apiRequest } from './client';
import type { OperationBody, OperationResponse } from './types';

/** A scraper source, as returned by the API. */
export type Source = OperationResponse<'SourcesController_get_v1'>;

/** Fetch strategy, from the source response (not the request body union). */
export type SourceFetchStrategy = Source['fetchStrategy'];

/** A single scrape run record. */
export type ScrapeRun = OperationResponse<'SourcesController_triggerScrape_v1', 201>;

/** Body accepted by {@link createSource}. */
export type CreateSourceBody = OperationBody<'SourcesController_create_v1'>;

/** Body accepted by {@link updateSource}. */
export type UpdateSourceBody = OperationBody<'SourcesController_update_v1'>;

/** Result of {@link testSource}. */
export type SourceTestResult = OperationResponse<'SourcesController_test_v1'>;

/** Body returned by the adapters endpoint (unwrapped by {@link listAdapters}). */
type AdapterListResponse = OperationResponse<'SourcesController_adapters_v1'>;

/** Result of {@link deleteSource}. */
export type DeletedSourceResponse = OperationResponse<'SourcesController_remove_v1'>;

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
 * Create a source.
 *
 * @param body - New source data.
 * @returns The created source.
 */
export async function createSource(body: CreateSourceBody): Promise<Source> {
  return apiRequest<Source>('/sources', { method: 'POST', body });
}

/**
 * Update a source's fields (slug excluded — immutable).
 *
 * @param slug - Source slug.
 * @param body - Fields to change.
 * @returns The updated source.
 */
export async function updateSource(slug: string, body: UpdateSourceBody): Promise<Source> {
  return apiRequest<Source>(`/sources/${slug}`, { method: 'PATCH', body });
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
 * Test connectivity for a source, without persisting anything.
 *
 * @param slug - Source slug.
 * @returns The test outcome.
 */
export async function testSource(slug: string): Promise<SourceTestResult> {
  return apiRequest<SourceTestResult>(`/sources/${slug}/test`, { method: 'POST' });
}

/**
 * List source slugs with a registered scraper adapter.
 *
 * @param signal - Optional abort signal.
 * @returns The registered slugs.
 */
export async function listAdapters(signal?: AbortSignal): Promise<readonly string[]> {
  const result = await apiRequest<AdapterListResponse>('/sources/adapters', { signal });
  return result.slugs;
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

/**
 * Permanently delete a source. Rejected with a 409 while the source has
 * associated jobs, raw jobs, or scrape runs.
 *
 * @param slug - Source slug.
 * @returns Deletion confirmation.
 */
export async function deleteSource(slug: string): Promise<DeletedSourceResponse> {
  return apiRequest<DeletedSourceResponse>(`/sources/${slug}`, { method: 'DELETE' });
}
