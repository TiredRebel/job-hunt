/**
 * @module lib/api/reconciliation
 *
 * Typed functions for the `/reconciliation` resource: per-source and
 * cross-source jobs-health buckets explaining the gap between
 * scraper-discovered postings and visible processed jobs.
 */
import { apiRequest } from './client';
import type { OperationResponse } from './types';

/** Per-source reconciliation buckets. */
export type SourceReconciliation =
  OperationResponse<'ReconciliationController_listBySource_v1'>[number];

/** Cross-source aggregate reconciliation. */
export type JobsReconciliationAggregate =
  OperationResponse<'ReconciliationController_aggregate_v1'>;

/**
 * List per-source reconciliation buckets.
 *
 * @param signal - Optional abort signal.
 * @returns One row per source, ordered by `sourceSlug` ascending.
 */
export async function getSourceReconciliation(
  signal?: AbortSignal,
): Promise<readonly SourceReconciliation[]> {
  return apiRequest<readonly SourceReconciliation[]>('/reconciliation/sources', { signal });
}

/**
 * Get the cross-source aggregate reconciliation.
 *
 * @param signal - Optional abort signal.
 * @returns Aggregate buckets across all sources.
 */
export async function getJobsReconciliation(
  signal?: AbortSignal,
): Promise<JobsReconciliationAggregate> {
  return apiRequest<JobsReconciliationAggregate>('/reconciliation/jobs', { signal });
}
