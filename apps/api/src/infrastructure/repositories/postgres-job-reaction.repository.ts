/**
 * @module postgres-job-reaction.repository
 *
 * Postgres implementation of {@link JobReactionRepository}. Append-only event
 * log; current stage is read from `core.job_reaction_current` view.
 */
import { Injectable } from '@nestjs/common';

import type { CurrentReaction, JobReactionEvent } from '../../domain/job-reaction.model';
import {
  type AppendReactionInput,
  type JobReactionRepository,
} from '../../application/ports/job-reaction-repository.port';
import { PgDatabase } from '../database/database.module';

function mapEventRow(row: Record<string, unknown>): JobReactionEvent {
  return {
    id: BigInt(row['id'] as number | string),
    jobId: BigInt(row['job_id'] as number | string),
    profileId: row['profile_id'] as number,
    reaction: row['reaction'] as JobReactionEvent['reaction'],
    note: (row['note'] as string | null) ?? null,
    occurredAt: new Date(row['occurred_at'] as string),
    createdAt: new Date(row['created_at'] as string),
  };
}

function mapCurrentRow(row: Record<string, unknown>): CurrentReaction {
  return {
    jobId: BigInt(row['job_id'] as number | string),
    profileId: row['profile_id'] as number,
    reaction: row['reaction'] as CurrentReaction['reaction'],
    occurredAt: new Date(row['occurred_at'] as string),
  };
}

/**
 * Postgres-backed job reaction repository.
 */
@Injectable()
export class PostgresJobReactionRepository implements JobReactionRepository {
  /**
   * Postgres-backed job reaction repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async append(input: AppendReactionInput): Promise<JobReactionEvent> {
    const result = await this.db.query<Record<string, unknown>>(
      `INSERT INTO core.job_reactions (job_id, profile_id, reaction, note, occurred_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.jobId,
        input.profileId,
        input.reaction,
        input.note ?? null,
        input.occurredAt ?? new Date(),
      ],
    );
    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Insert unexpectedly returned no row');
    }
    return mapEventRow(row);
  }

  /** @inheritdoc */
  public async appendBulk(
    jobIds: readonly bigint[],
    profileId: number,
    reaction: JobReactionEvent['reaction'],
    note?: string | null,
    occurredAt?: Date,
  ): Promise<number> {
    const timestamp = occurredAt ?? new Date();
    let inserted = 0;
    for (const jobId of jobIds) {
      await this.db.query(
        `INSERT INTO core.job_reactions (job_id, profile_id, reaction, note, occurred_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [jobId, profileId, reaction, note ?? null, timestamp],
      );
      inserted += 1;
    }
    return inserted;
  }

  /** @inheritdoc */
  public async timeline(jobId: bigint, profileId: number): Promise<readonly JobReactionEvent[]> {
    const result = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM core.job_reactions
       WHERE job_id = $1 AND profile_id = $2
       ORDER BY occurred_at DESC, id DESC`,
      [jobId, profileId],
    );
    return result.rows.map(mapEventRow);
  }

  /** @inheritdoc */
  public async findCurrent(jobId: bigint, profileId: number): Promise<CurrentReaction | null> {
    const result = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM core.job_reaction_current
       WHERE job_id = $1 AND profile_id = $2`,
      [jobId, profileId],
    );
    const row = result.rows[0];
    return row === undefined ? null : mapCurrentRow(row);
  }

  /** @inheritdoc */
  public async findCurrentMany(
    jobIds: readonly bigint[],
    profileId: number,
  ): Promise<ReadonlyMap<bigint, CurrentReaction>> {
    if (jobIds.length === 0) {
      return new Map();
    }
    const result = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM core.job_reaction_current
       WHERE job_id = ANY($1::bigint[]) AND profile_id = $2`,
      [jobIds.map((id) => id.toString()), profileId],
    );
    const map = new Map<bigint, CurrentReaction>();
    for (const row of result.rows) {
      const current = mapCurrentRow(row);
      map.set(current.jobId, current);
    }
    return map;
  }
}
