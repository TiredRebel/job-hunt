/**
 * @module postgres-job.repository
 *
 * Postgres implementation of {@link JobRepository}. Builds dynamic SQL for
 * filtering, date intervals, full-text search, and reaction stages.
 */
import { Injectable } from '@nestjs/common';

import type { Job } from '../../domain/job.model';
import type {
  JobFilter,
  JobRepository,
  JobSortBy,
  PaginatedJobs,
  SortDir,
} from '../../application/ports/job-repository.port';
import { PgDatabase } from '../database/database.module';

/**
 * Allowlisted SQL sort expressions per {@link JobSortBy}, keyed to prevent
 * SQL injection via the sort parameter (never interpolate a client value
 * directly into `ORDER BY`). `posted` uses the same effective date rendered
 * in the Jobs table: the authoritative source date or, when it is absent,
 * the first-seen fallback. `NULLS LAST` keeps genuinely nullable sort values
 * at the bottom regardless of direction.
 */
const SORT_EXPRESSIONS: Record<JobSortBy, string> = {
  score: 'matches.score',
  posted: 'COALESCE(j.posted_at, j.first_seen_at)',
  salary: 'COALESCE(j.salary_max, j.salary_min)',
  lastSeen: 'j.last_seen_at',
  // Manual board card order (core.job_board_position, joined only in the
  // page query below — see design.md D4 in
  // openspec/changes/notification-settings-and-board-reorder). NULLS LAST
  // in buildOrderBy sends never-positioned jobs to the bottom for free.
  board: 'bp.position',
};

/**
 * Build the `ORDER BY` clause for a jobs list query.
 *
 * `board` is always ascending regardless of `sortDir`: `bp.position` is an
 * absolute manually-arranged index (D3/D4), not a high/low metric like
 * score or salary — inverting it would silently reverse the persisted
 * card order every time a caller omits `sortDir` (the board UI never sets
 * it), which is exactly the bug this guards against.
 *
 * @param sortBy - Sort column (default `lastSeen`).
 * @param sortDir - Sort direction (default `desc`, ignored for `board`).
 * A unique `j.id DESC` secondary key keeps offset pages stable when jobs
 * share the primary sort value.
 *
 * @returns The `ORDER BY` SQL fragment.
 */
function buildOrderBy(sortBy: JobSortBy | undefined, sortDir: SortDir | undefined): string {
  const resolvedSortBy = sortBy ?? 'lastSeen';
  const expression = SORT_EXPRESSIONS[resolvedSortBy];
  const direction = resolvedSortBy === 'board' || sortDir === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${expression} ${direction} NULLS LAST, j.id DESC`;
}

/**
 * Maps a raw pg row to the {@link Job} entity.
 *
 * @param row - Database row.
 * @returns Job entity.
 */
function mapJobRow(row: Record<string, unknown>): Job {
  const matchExplanation = row['match_explanation'];
  return {
    id: BigInt(row['id'] as number | string),
    sourceId: row['source_id'] as number,
    sourceSlug: row['source_slug'] as string,
    externalId: row['external_id'] as string,
    url: row['url'] as string,
    title: row['title'] as string,
    company: (row['company'] as string | null) ?? null,
    descriptionMd: (row['description_md'] as string | null) ?? null,
    summary: (row['summary'] as string | null) ?? null,
    tags: (row['tags'] as string[] | null) ?? [],
    redFlags: (row['red_flags'] as string[] | null) ?? [],
    salaryMin: (row['salary_min'] as number | null) ?? null,
    salaryMax: (row['salary_max'] as number | null) ?? null,
    salaryCurrency: (row['salary_currency'] as string | null) ?? null,
    seniority: (row['seniority'] as Job['seniority']) ?? 'unknown',
    remote: (row['remote'] as Job['remote']) ?? 'unknown',
    location: (row['location'] as string | null) ?? null,
    postedAt: row['posted_at'] ? new Date(row['posted_at'] as string) : null,
    firstSeenAt: new Date(row['first_seen_at'] as string),
    lastSeenAt: new Date(row['last_seen_at'] as string),
    status: (row['status'] as Job['status']) ?? 'new',
    matchScore: (row['match_score'] as number | null) ?? null,
    currentReaction: (row['current_reaction'] as string | null) ?? null,
    ...(matchExplanation === undefined
      ? {}
      : { matchExplanation: matchExplanation as string | null }),
  };
}

/**
 * Postgres-backed job repository.
 */
@Injectable()
export class PostgresJobRepository implements JobRepository {
  /**
   * Postgres-backed job repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /**
   * Build the common WHERE clause and bound values from a filter.
   *
   * @param filter - Filter parameters.
   * @param paramStart - Starting `$n` index.
   * @returns SQL fragment, bound values, and next parameter index.
   */
  private buildWhere(
    filter: JobFilter,
    paramStart: number,
  ): {
    readonly where: string;
    readonly values: unknown[];
    readonly nextParam: number;
  } {
    const conditions: string[] = ["j.status <> 'hidden'"];
    const values: unknown[] = [];
    let param = paramStart;

    if (filter.sourceIds !== undefined && filter.sourceIds.length > 0) {
      conditions.push(`j.source_id = ANY($${param}::int[])`);
      values.push(filter.sourceIds.map((id) => (typeof id === 'bigint' ? Number(id) : id)));
      param += 1;
    }
    if (filter.tags !== undefined && filter.tags.length > 0) {
      conditions.push(`j.tags && $${param}::text[]`);
      values.push(filter.tags);
      param += 1;
    }
    if (filter.remote !== undefined && filter.remote.length > 0) {
      conditions.push(`j.remote = ANY($${param}::text[])`);
      values.push(filter.remote);
      param += 1;
    }
    if (filter.seniority !== undefined && filter.seniority.length > 0) {
      conditions.push(`j.seniority = ANY($${param}::text[])`);
      values.push(filter.seniority);
      param += 1;
    }
    if (filter.status !== undefined && filter.status.length > 0) {
      conditions.push(`j.status = ANY($${param}::text[])`);
      values.push(filter.status);
      param += 1;
    }
    if (filter.reaction !== undefined && filter.reaction.length > 0) {
      conditions.push(`COALESCE(current_reaction.reaction, 'none') = ANY($${param}::text[])`);
      values.push(filter.reaction);
      param += 1;
    }
    if (filter.scoreMin !== undefined) {
      conditions.push(`COALESCE(matches.score, 0) >= $${param}`);
      values.push(filter.scoreMin);
      param += 1;
    }
    if (filter.scoreMax !== undefined) {
      conditions.push(`COALESCE(matches.score, 0) <= $${param}`);
      values.push(filter.scoreMax);
      param += 1;
    }
    if (filter.salaryMin !== undefined) {
      conditions.push(`j.salary_max >= $${param}`);
      values.push(filter.salaryMin);
      param += 1;
    }
    if (filter.salaryMax !== undefined) {
      conditions.push(`j.salary_min <= $${param}`);
      values.push(filter.salaryMax);
      param += 1;
    }
    if (
      filter.dateField !== undefined &&
      (filter.dateFrom !== undefined || filter.dateTo !== undefined)
    ) {
      const column = filter.dateField === 'posted' ? 'j.posted_at' : 'j.first_seen_at';
      if (filter.dateFrom !== undefined) {
        conditions.push(`${column} >= $${param}`);
        values.push(filter.dateFrom);
        param += 1;
      }
      if (filter.dateTo !== undefined) {
        conditions.push(`${column} <= $${param}`);
        values.push(filter.dateTo);
        param += 1;
      }
    }
    if (filter.query !== undefined && filter.query.trim().length > 0) {
      conditions.push(
        `to_tsvector('simple', COALESCE(j.title, '') || ' ' || COALESCE(j.company, '') || ' ' || COALESCE(j.description_md, '')) @@ websearch_to_tsquery('simple', $${param})`,
      );
      values.push(filter.query.trim());
      param += 1;
    }

    return { where: conditions.join(' AND '), values, nextParam: param };
  }

  /** @inheritdoc */
  public async findMany(filter: JobFilter): Promise<PaginatedJobs> {
    const { where, values, nextParam } = this.buildWhere(filter, 1);

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM core.jobs j
      LEFT JOIN core.job_reaction_current current_reaction
        ON current_reaction.job_id = j.id
      LEFT JOIN core.profiles p ON p.is_active = true
      LEFT JOIN core.job_matches matches
        ON matches.job_id = j.id AND matches.profile_id = p.id
      WHERE ${where}
    `;

    const pageValues = [...values, filter.limit, filter.offset];
    const pageSql = `
      SELECT
        j.*,
        s.slug AS source_slug,
        current_reaction.reaction AS current_reaction,
        matches.score AS match_score
      FROM core.jobs j
      JOIN core.sources s ON s.id = j.source_id
      LEFT JOIN core.job_reaction_current current_reaction
        ON current_reaction.job_id = j.id
      LEFT JOIN core.profiles p ON p.is_active = true
      LEFT JOIN core.job_matches matches
        ON matches.job_id = j.id AND matches.profile_id = p.id
      LEFT JOIN core.job_board_position bp
        ON bp.job_id = j.id AND bp.profile_id = p.id
      WHERE ${where}
      ${buildOrderBy(filter.sortBy, filter.sortDir)}
      LIMIT $${nextParam} OFFSET $${nextParam + 1}
    `;

    const [countResult, rowsResult] = await Promise.all([
      this.db.query<{ total: number }>(countSql, values),
      this.db.query<Record<string, unknown>>(pageSql, pageValues),
    ]);

    return {
      items: rowsResult.rows.map(mapJobRow),
      total: countResult.rows[0]?.total ?? 0,
    };
  }

  /** @inheritdoc */
  public async findById(id: bigint): Promise<Job | null> {
    const sql = `
      SELECT
        j.*,
        s.slug AS source_slug,
        current_reaction.reaction AS current_reaction,
        matches.score AS match_score,
        matches.explanation AS match_explanation
      FROM core.jobs j
      JOIN core.sources s ON s.id = j.source_id
      LEFT JOIN core.job_reaction_current current_reaction
        ON current_reaction.job_id = j.id
      LEFT JOIN core.profiles p ON p.is_active = true
      LEFT JOIN core.job_matches matches
        ON matches.job_id = j.id AND matches.profile_id = p.id
      WHERE j.id = $1
    `;
    const result = await this.db.query<Record<string, unknown>>(sql, [id]);
    const row = result.rows[0];
    return row === undefined ? null : mapJobRow(row);
  }

  /** @inheritdoc */
  public async setStatus(
    id: bigint,
    status: 'archived' | 'hidden' | 'processed' | 'new',
  ): Promise<Job | null> {
    await this.db.query('UPDATE core.jobs SET status = $1 WHERE id = $2', [status, id]);
    return this.findById(id);
  }

  /** @inheritdoc */
  public async delete(id: bigint): Promise<boolean> {
    return this.db.transaction(async (client) => {
      const result = await client.query('DELETE FROM core.jobs WHERE id = $1 RETURNING id', [id]);
      return result.rowCount === 1;
    });
  }

  /** @inheritdoc */
  public async deleteMany(ids: readonly bigint[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    return this.db.transaction(async (client) => {
      const result = await client.query(
        'DELETE FROM core.jobs WHERE id = ANY($1::bigint[]) RETURNING id',
        [ids],
      );
      return result.rowCount ?? 0;
    });
  }
}
