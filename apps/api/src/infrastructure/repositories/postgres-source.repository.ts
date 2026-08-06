/**
 * @module postgres-source.repository
 *
 * Postgres implementation of {@link SourceRepository}. Sources are mostly
 * read-only here; only `enabled` can be toggled. Scrape runs are read from
 * `scraper.scrape_runs`.
 */
import { Injectable } from '@nestjs/common';

import type { ScrapeRun } from '../../domain/scrape-run.model';
import type { Source } from '../../domain/source.model';
import {
  type CreateSourceInput,
  type SourceRepository,
  type UpdateSourceInput,
} from '../../application/ports/source-repository.port';
import { PgDatabase } from '../database/database.module';

function mapSourceRow(row: Record<string, unknown>): Source {
  return {
    id: row['id'] as number,
    slug: row['slug'] as string,
    name: row['name'] as string,
    baseUrl: row['base_url'] as string,
    enabled: row['enabled'] as boolean,
    fetchStrategy: row['fetch_strategy'] as Source['fetchStrategy'],
    config: (row['config'] as Record<string, unknown> | null) ?? {},
    createdAt: new Date(row['created_at'] as string),
    updatedAt: new Date(row['updated_at'] as string),
  };
}

function mapRunRow(row: Record<string, unknown>): ScrapeRun {
  return {
    id: BigInt(row['id'] as number | string),
    sourceId: row['source_id'] as number,
    sourceSlug: row['source_slug'] as string,
    startedAt: new Date(row['started_at'] as string),
    finishedAt: row['finished_at'] ? new Date(row['finished_at'] as string) : null,
    status: row['status'] as ScrapeRun['status'],
    stats: (row['stats'] as Record<string, number> | null) ?? {},
    error: (row['error'] as string | null) ?? null,
  };
}

/**
 * Postgres-backed source repository.
 */
@Injectable()
export class PostgresSourceRepository implements SourceRepository {
  /**
   * Postgres-backed source repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async findAll(): Promise<readonly Source[]> {
    const result = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM core.sources ORDER BY name',
    );
    return result.rows.map(mapSourceRow);
  }

  /** @inheritdoc */
  public async findBySlug(slug: string): Promise<Source | null> {
    const result = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM core.sources WHERE slug = $1',
      [slug],
    );
    const row = result.rows[0];
    return row === undefined ? null : mapSourceRow(row);
  }

  /** @inheritdoc */
  public async create(input: CreateSourceInput): Promise<Source | null> {
    const result = await this.db.query<Record<string, unknown>>(
      `INSERT INTO core.sources (slug, name, base_url, fetch_strategy, config, enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING
       RETURNING *`,
      [
        input.slug,
        input.name,
        input.baseUrl,
        input.fetchStrategy,
        JSON.stringify(input.config ?? {}),
        input.enabled ?? true,
      ],
    );
    const row = result.rows[0];
    return row === undefined ? null : mapSourceRow(row);
  }

  /** @inheritdoc */
  public async update(slug: string, patch: UpdateSourceInput): Promise<Source | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let param = 1;

    if (patch.name !== undefined) {
      setClauses.push(`name = $${param}`);
      values.push(patch.name);
      param += 1;
    }
    if (patch.baseUrl !== undefined) {
      setClauses.push(`base_url = $${param}`);
      values.push(patch.baseUrl);
      param += 1;
    }
    if (patch.fetchStrategy !== undefined) {
      setClauses.push(`fetch_strategy = $${param}`);
      values.push(patch.fetchStrategy);
      param += 1;
    }
    if (patch.config !== undefined) {
      setClauses.push(`config = $${param}`);
      values.push(JSON.stringify(patch.config));
      param += 1;
    }
    if (patch.enabled !== undefined) {
      setClauses.push(`enabled = $${param}`);
      values.push(patch.enabled);
      param += 1;
    }
    if (setClauses.length === 0) {
      return this.findBySlug(slug);
    }

    values.push(slug);
    const sql = `UPDATE core.sources SET ${setClauses.join(', ')} WHERE slug = $${param} RETURNING *`;
    const result = await this.db.query<Record<string, unknown>>(sql, values);
    const row = result.rows[0];
    return row === undefined ? null : mapSourceRow(row);
  }

  /** @inheritdoc */
  public async setEnabled(slug: string, enabled: boolean): Promise<Source | null> {
    const result = await this.db.query<Record<string, unknown>>(
      'UPDATE core.sources SET enabled = $1 WHERE slug = $2 RETURNING *',
      [enabled, slug],
    );
    const row = result.rows[0];
    return row === undefined ? null : mapSourceRow(row);
  }

  /** @inheritdoc */
  public async findRuns(
    sourceId: number,
    limit: number,
    offset: number,
  ): Promise<readonly ScrapeRun[]> {
    const result = await this.db.query<Record<string, unknown>>(
      `SELECT r.*, s.slug AS source_slug
       FROM scraper.scrape_runs r
       JOIN core.sources s ON s.id = r.source_id
       WHERE r.source_id = $1
       ORDER BY r.started_at DESC
       LIMIT $2 OFFSET $3`,
      [sourceId, limit, offset],
    );
    return result.rows.map(mapRunRow);
  }

  /** @inheritdoc */
  public async delete(slug: string): Promise<'deleted' | 'not_found' | 'in_use'> {
    const result = await this.db.query(
      `DELETE FROM core.sources s
       WHERE s.slug = $1
         AND NOT EXISTS (SELECT 1 FROM core.jobs j WHERE j.source_id = s.id)
         AND NOT EXISTS (SELECT 1 FROM scraper.jobs_raw jr WHERE jr.source_id = s.id)
         AND NOT EXISTS (SELECT 1 FROM scraper.scrape_runs sr WHERE sr.source_id = s.id)
       RETURNING id`,
      [slug],
    );
    if (result.rowCount === 1) {
      return 'deleted';
    }
    const stillExists = await this.findBySlug(slug);
    return stillExists === null ? 'not_found' : 'in_use';
  }
}
