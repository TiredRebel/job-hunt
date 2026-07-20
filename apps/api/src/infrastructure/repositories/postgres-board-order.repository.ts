/**
 * @module postgres-board-order.repository
 *
 * Postgres implementation of {@link BoardOrderRepository}. Rewrites
 * positions for an entire submitted list in one statement via
 * `unnest(...) WITH ORDINALITY`, rather than one round trip per row
 * (design.md D3 in openspec/changes/notification-settings-and-board-reorder).
 */
import { Injectable } from '@nestjs/common';

import type { BoardOrderRepository } from '../../application/ports/board-order-repository.port';
import { PgDatabase } from '../database/database.module';

/**
 * Postgres-backed board order repository.
 */
@Injectable()
export class PostgresBoardOrderRepository implements BoardOrderRepository {
  /**
   * Postgres-backed board order repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async setStageOrder(
    profileId: number,
    stage: string,
    jobIds: readonly bigint[],
  ): Promise<void> {
    if (jobIds.length === 0) {
      return;
    }
    await this.db.query(
      `INSERT INTO core.job_board_position (profile_id, job_id, stage, position, updated_at)
       SELECT $1, job_id, $2, (ord - 1)::int, now()
       FROM unnest($3::bigint[]) WITH ORDINALITY AS t(job_id, ord)
       ON CONFLICT (profile_id, job_id) DO UPDATE
       SET stage = EXCLUDED.stage, position = EXCLUDED.position, updated_at = EXCLUDED.updated_at`,
      [profileId, stage, jobIds],
    );
  }
}
