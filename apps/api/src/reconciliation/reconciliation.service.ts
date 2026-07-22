/**
 * @module reconciliation.service
 *
 * Application service for the jobs-reconciliation read model. Bridges the
 * repository port to the controller; aggregates per-source rows into the
 * cross-source total and derives `legacyDelta`. Also exposes a public,
 * dashboard-facing view of the dead-letter listing (the automation
 * module's `GET /v1/automation/jobs/dead-letter` is internal-token-guarded
 * and cannot be called from a browser).
 */
import { Inject, Injectable } from '@nestjs/common';

import {
  JOBS_RECONCILIATION_REPOSITORY,
  type JobsReconciliationRepository,
} from '../application/ports/jobs-reconciliation.port';
import {
  SCRAPER_CLIENT,
  type DeadLetterJob,
  type ScraperClient,
} from '../application/ports/scraper-client.port';
import type { ReconciliationAggregate, ReconciliationRow } from '../domain/reconciliation.model';

/**
 * Reconciliation application service.
 */
@Injectable()
export class ReconciliationService {
  /**
   * Reconciliation application service.
   *
   * @param repository - Reconciliation repository port.
   * @param scraper - Scraper HTTP client port (for the dead-letter listing).
   */
  public constructor(
    @Inject(JOBS_RECONCILIATION_REPOSITORY)
    private readonly repository: JobsReconciliationRepository,
    @Inject(SCRAPER_CLIENT)
    private readonly scraper: ScraperClient,
  ) {}

  /**
   * List per-source reconciliation buckets.
   *
   * @returns One row per source, ordered by `sourceSlug` ascending.
   */
  public async listBySource(): Promise<readonly ReconciliationRow[]> {
    return this.repository.listBySource();
  }

  /**
   * Compute the cross-source aggregate reconciliation.
   *
   * @returns Aggregate buckets across all sources.
   */
  public async aggregate(): Promise<ReconciliationAggregate> {
    return this.repository.aggregate();
  }

  /**
   * List dead-lettered raw jobs for the dashboard. Mirrors the
   * internal-token-guarded `GET /v1/automation/jobs/dead-letter` but is
   * exposed publicly on the reconciliation controller so the browser can
   * reach it.
   *
   * @param limit - Maximum number of rows to return.
   * @returns Dead-lettered raw jobs, newest first.
   */
  public async deadLetterJobs(limit: number): Promise<readonly DeadLetterJob[]> {
    return this.scraper.listDeadLetter(limit);
  }
}
