/**
 * @module postgres-jobs-reconciliation.repository
 *
 * Postgres implementation of {@link JobsReconciliationRepository}. A single
 * `GROUP BY source_id` query joins `core.sources` LEFT JOIN `scraper.jobs_raw`
 * LEFT JOIN `core.jobs` and uses `COUNT(...) FILTER (WHERE ...)` to compute
 * every bucket in one pass.
 */
import { Injectable } from '@nestjs/common';

import type { ReconciliationAggregate, ReconciliationRow } from '../../domain/reconciliation.model';
import type { JobsReconciliationRepository } from '../../application/ports/jobs-reconciliation.port';
import { PgDatabase } from '../database/database.module';

/**
 * Raw shape returned by the per-source SQL query.
 */
interface ReconciliationDbRow {
  readonly id: number;
  readonly slug: string;
  readonly raw_total: string;
  readonly processed: string;
  readonly pending: string;
  readonly failed: string;
  readonly visible_jobs: string;
  readonly hidden_jobs: string;
}

/**
 * Maps a raw pg row to the {@link ReconciliationRow} entity.
 *
 * @param row - Database row (counts come back as strings via pg).
 * @returns Reconciliation row entity.
 */
function mapRow(row: ReconciliationDbRow): ReconciliationRow {
  return {
    sourceId: row.id,
    sourceSlug: row.slug,
    rawTotal: Number(row.raw_total),
    processed: Number(row.processed),
    pending: Number(row.pending),
    failed: Number(row.failed),
    visibleJobs: Number(row.visible_jobs),
    hiddenJobs: Number(row.hidden_jobs),
  };
}

/**
 * Postgres-backed reconciliation repository.
 */
@Injectable()
export class PostgresJobsReconciliationRepository implements JobsReconciliationRepository {
  /**
   * Postgres-backed reconciliation repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async listBySource(): Promise<readonly ReconciliationRow[]> {
    const sql = `
      SELECT
        s.id,
        s.slug,
        COUNT(raw.id) AS raw_total,
        COUNT(raw.id) FILTER (WHERE raw.processing_status = 'done') AS processed,
        COUNT(raw.id) FILTER (WHERE raw.processing_status IN ('pending','queued')) AS pending,
        COUNT(raw.id) FILTER (WHERE raw.processing_status = 'failed') AS failed,
        COUNT(j.id) FILTER (WHERE j.status <> 'hidden') AS visible_jobs,
        COUNT(j.id) FILTER (WHERE j.status = 'hidden') AS hidden_jobs
      FROM core.sources s
      LEFT JOIN scraper.jobs_raw raw ON raw.source_id = s.id
      LEFT JOIN core.jobs j ON j.raw_id = raw.id
      GROUP BY s.id, s.slug
      ORDER BY s.slug ASC
    `;
    const result = await this.db.query<ReconciliationDbRow>(sql);
    return result.rows.map(mapRow);
  }

  /** @inheritdoc */
  public async aggregate(): Promise<ReconciliationAggregate> {
    const rows = await this.listBySource();
    const rawTotal = rows.reduce((sum, row) => sum + row.rawTotal, 0);
    const processed = rows.reduce((sum, row) => sum + row.processed, 0);
    const pending = rows.reduce((sum, row) => sum + row.pending, 0);
    const failed = rows.reduce((sum, row) => sum + row.failed, 0);
    const visibleJobs = rows.reduce((sum, row) => sum + row.visibleJobs, 0);
    const hiddenJobs = rows.reduce((sum, row) => sum + row.hiddenJobs, 0);
    return {
      rawTotal,
      processed,
      pending,
      failed,
      visibleJobs,
      hiddenJobs,
      legacyDelta: processed - (visibleJobs + hiddenJobs),
    };
  }
}
