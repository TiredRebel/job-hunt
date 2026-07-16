/**
 * @module postgres-cover-letter.repository
 *
 * Postgres implementation of {@link CoverLetterRepository}.
 */
import { Injectable } from '@nestjs/common';

import type { CoverLetter } from '../../domain/cover-letter.model';
import type { CoverLetterRepository } from '../../application/ports/cover-letter-repository.port';
import { PgDatabase } from '../database/database.module';

/**
 * Maps a raw pg row to the {@link CoverLetter} entity.
 *
 * @param row - Database row.
 * @returns Cover-letter entity.
 */
function mapRow(row: Record<string, unknown>): CoverLetter {
  return {
    id: BigInt(row['id'] as number | string),
    jobId: BigInt(row['job_id'] as number | string),
    profileId: row['profile_id'] as number,
    bodyMd: row['body_md'] as string,
    modelUsed: (row['model_used'] as string | null) ?? null,
    edited: row['edited'] as boolean,
    createdAt: new Date(row['created_at'] as string),
    updatedAt: new Date(row['updated_at'] as string),
  };
}

/**
 * Postgres-backed cover-letter repository.
 */
@Injectable()
export class PostgresCoverLetterRepository implements CoverLetterRepository {
  /**
   * Postgres-backed cover-letter repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async findByJobId(jobId: bigint, profileId: number): Promise<CoverLetter | null> {
    const result = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM core.cover_letters WHERE job_id = $1 AND profile_id = $2',
      [jobId, profileId],
    );
    const row = result.rows[0];
    return row === undefined ? null : mapRow(row);
  }

  /** @inheritdoc */
  public async saveEdited(jobId: bigint, profileId: number, bodyMd: string): Promise<CoverLetter> {
    const result = await this.db.query<Record<string, unknown>>(
      `INSERT INTO core.cover_letters (job_id, profile_id, body_md, edited)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (job_id, profile_id)
       DO UPDATE SET body_md = $3, edited = true, updated_at = now()
       RETURNING *`,
      [jobId, profileId, bodyMd],
    );
    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Upsert unexpectedly returned no row');
    }
    return mapRow(row);
  }
}
