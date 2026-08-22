/**
 * @module postgres-keyword-dictionary.repository
 *
 * Postgres implementation of {@link KeywordDictionaryRepository}.
 */
import { Injectable } from '@nestjs/common';

import type { KeywordDictionary } from '../../domain/keyword-dictionary.model';
import {
  type KeywordDictionaryRepository,
  type UpsertDictionaryInput,
} from '../../application/ports/keyword-dictionary-repository.port';
import { ConflictError, NotFoundError } from '../../application/ports/repository.error';
import { PgDatabase } from '../database/database.module';

function mapRow(row: Record<string, unknown>): KeywordDictionary {
  return {
    id: row['id'] as number,
    slug: row['slug'] as string,
    name: row['name'] as string,
    kind: row['kind'] as KeywordDictionary['kind'],
    items: row['items'] as KeywordDictionary['items'],
    disabledItems: (row['disabled_items'] as string[] | null) ?? [],
    appliesTo: (row['applies_to'] as string[] | null) ?? [],
    enabled: row['enabled'] as boolean,
    createdAt: new Date(row['created_at'] as string),
    updatedAt: new Date(row['updated_at'] as string),
  };
}

/**
 * Postgres-backed keyword dictionary repository.
 */
@Injectable()
export class PostgresKeywordDictionaryRepository implements KeywordDictionaryRepository {
  /**
   * Postgres-backed keyword dictionary repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async findAll(kind?: KeywordDictionary['kind']): Promise<readonly KeywordDictionary[]> {
    const sql =
      kind === undefined
        ? 'SELECT * FROM core.keyword_dictionaries ORDER BY name'
        : 'SELECT * FROM core.keyword_dictionaries WHERE kind = $1 ORDER BY name';
    const values = kind === undefined ? [] : [kind];
    const result = await this.db.query<Record<string, unknown>>(sql, values);
    return result.rows.map(mapRow);
  }

  /** @inheritdoc */
  public async findBySlug(slug: string): Promise<KeywordDictionary | null> {
    const result = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM core.keyword_dictionaries WHERE slug = $1',
      [slug],
    );
    const row = result.rows[0];
    return row === undefined ? null : mapRow(row);
  }

  /** @inheritdoc */
  public async create(input: UpsertDictionaryInput): Promise<KeywordDictionary> {
    const existing = await this.findBySlug(input.slug);
    if (existing !== null) {
      throw new ConflictError(`Dictionary slug ${input.slug} already exists`);
    }
    const result = await this.db.query<Record<string, unknown>>(
      `INSERT INTO core.keyword_dictionaries (slug, name, kind, items, disabled_items, applies_to, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.slug,
        input.name,
        input.kind,
        JSON.stringify(input.items),
        input.disabledItems ?? [],
        input.appliesTo ?? [],
        input.enabled ?? true,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Insert unexpectedly returned no row');
    }
    return mapRow(row);
  }

  /** @inheritdoc */
  public async update(
    slug: string,
    input: Partial<Omit<UpsertDictionaryInput, 'slug' | 'kind'>>,
  ): Promise<KeywordDictionary | null> {
    const existing = await this.findBySlug(slug);
    if (existing === null) {
      throw new NotFoundError(`Dictionary ${slug} not found`);
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let param = 1;

    if (input.name !== undefined) {
      setClauses.push(`name = $${param}`);
      values.push(input.name);
      param += 1;
    }
    if (input.items !== undefined) {
      setClauses.push(`items = $${param}`);
      values.push(JSON.stringify(input.items));
      param += 1;
    }
    if (input.disabledItems !== undefined) {
      setClauses.push(`disabled_items = $${param}`);
      values.push(input.disabledItems);
      param += 1;
    }
    if (input.appliesTo !== undefined) {
      setClauses.push(`applies_to = $${param}`);
      values.push(input.appliesTo);
      param += 1;
    }
    if (input.enabled !== undefined) {
      setClauses.push(`enabled = $${param}`);
      values.push(input.enabled);
      param += 1;
    }
    if (setClauses.length === 0) {
      return existing;
    }

    values.push(slug);
    const sql = `UPDATE core.keyword_dictionaries SET ${setClauses.join(', ')} WHERE slug = $${param} RETURNING *`;
    const result = await this.db.query<Record<string, unknown>>(sql, values);
    const row = result.rows[0];
    if (row === undefined) {
      throw new Error('Update unexpectedly returned no row');
    }
    return mapRow(row);
  }

  /** @inheritdoc */
  public async delete(slug: string): Promise<boolean> {
    const result = await this.db.query<Record<string, unknown>>(
      'DELETE FROM core.keyword_dictionaries WHERE slug = $1 RETURNING id',
      [slug],
    );
    if (result.rows.length === 0) {
      throw new NotFoundError(`Dictionary ${slug} not found`);
    }
    return true;
  }
}
