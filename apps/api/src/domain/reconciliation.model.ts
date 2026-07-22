/**
 * @module reconciliation.model
 *
 * Framework-free value types for the jobs-reconciliation read model.
 * Reconciliation explains the numerical gap between scraper-discovered
 * postings (`scraper.jobs_raw`) and visible processed jobs (`core.jobs`).
 */

/**
 * Per-source reconciliation buckets.
 *
 * Invariant: `rawTotal = processed + pending + failed`.
 * `visibleJobs + hiddenJobs` is the count of `core.jobs` rows joined via
 * `raw_id`; a non-zero `legacyDelta` (see {@link ReconciliationAggregate})
 * surfaces `core.jobs` rows whose `raw_id` is null or whose raw parent was
 * deleted.
 */
export interface ReconciliationRow {
  /** Source primary key. */
  readonly sourceId: number;
  /** Source slug (denormalized for display). */
  readonly sourceSlug: string;
  /** All `scraper.jobs_raw` rows for the source. */
  readonly rawTotal: number;
  /** `jobs_raw` rows with `processing_status = 'done'`. */
  readonly processed: number;
  /** `jobs_raw` rows with `processing_status IN ('pending','queued')`. */
  readonly pending: number;
  /** `jobs_raw` rows with `processing_status = 'failed'`. */
  readonly failed: number;
  /** `core.jobs` rows joined via `raw_id` with `status <> 'hidden'`. */
  readonly visibleJobs: number;
  /** `core.jobs` rows joined via `raw_id` with `status = 'hidden'`. */
  readonly hiddenJobs: number;
}

/**
 * Cross-source aggregate reconciliation.
 *
 * `legacyDelta = processed - (visibleJobs + hiddenJobs)`. On a clean seed
 * this is zero; a negative value means `core.jobs` has rows whose `raw_id`
 * is null or points to a deleted `jobs_raw` row (legacy/manual rows).
 */
export interface ReconciliationAggregate {
  readonly rawTotal: number;
  readonly processed: number;
  readonly pending: number;
  readonly failed: number;
  readonly visibleJobs: number;
  readonly hiddenJobs: number;
  readonly legacyDelta: number;
}
