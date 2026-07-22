/**
 * @module jobs-reconciliation.port
 *
 * Port for the jobs-reconciliation read model. Implementations live in the
 * infrastructure layer (Postgres). Read-only — no write paths.
 */
import type { ReconciliationAggregate, ReconciliationRow } from '../../domain/reconciliation.model';

/**
 * Reconciliation repository contract.
 */
export interface JobsReconciliationRepository {
  /**
   * List per-source reconciliation buckets, ordered by `sourceSlug` ascending.
   *
   * @returns One row per `core.sources` row, with all buckets zero when no
   *   `jobs_raw` rows exist for the source.
   */
  listBySource(): Promise<readonly ReconciliationRow[]>;

  /**
   * Compute the cross-source aggregate. The default implementation sums the
   * per-source rows and derives `legacyDelta`; concrete repositories MAY
   * override with a single SQL aggregation.
   *
   * @returns Aggregate buckets across all sources.
   */
  aggregate(): Promise<ReconciliationAggregate>;
}

/**
 * Injection token for the reconciliation repository port.
 */
export const JOBS_RECONCILIATION_REPOSITORY = Symbol('JOBS_RECONCILIATION_REPOSITORY');
