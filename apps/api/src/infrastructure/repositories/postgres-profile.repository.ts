/**
 * @module postgres-profile.repository
 *
 * Postgres implementation of {@link ProfileRepository}. Activation is handled
 * transactionally so exactly one profile remains active.
 */
import { Injectable } from '@nestjs/common';

import type { Profile } from '../../domain/profile.model';
import {
  type CreateProfileInput,
  type ProfileRepository,
  type UpdateProfileInput,
} from '../../application/ports/profile-repository.port';
import { NotFoundError } from '../../application/ports/repository.error';
import { PgDatabase } from '../database/database.module';

function mapRow(row: Record<string, unknown>): Profile {
  return {
    id: row['id'] as number,
    name: row['name'] as string,
    cvMd: (row['cv_md'] as string | null) ?? null,
    skills: (row['skills'] as string[] | null) ?? [],
    preferences: (row['preferences'] as Record<string, unknown> | null) ?? {},
    isActive: row['is_active'] as boolean,
    createdAt: new Date(row['created_at'] as string),
    updatedAt: new Date(row['updated_at'] as string),
  } as Profile;
}

/**
 * Postgres-backed profile repository.
 */
@Injectable()
export class PostgresProfileRepository implements ProfileRepository {
  /**
   * Postgres-backed profile repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async findAll(): Promise<readonly Profile[]> {
    const result = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM core.profiles ORDER BY created_at',
    );
    return result.rows.map(mapRow);
  }

  /** @inheritdoc */
  public async findActive(): Promise<Profile | null> {
    const result = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM core.profiles WHERE is_active = true LIMIT 1',
    );
    const row = result.rows[0];
    return row === undefined ? null : mapRow(row);
  }

  /** @inheritdoc */
  public async findById(id: number): Promise<Profile | null> {
    const result = await this.db.query<Record<string, unknown>>(
      'SELECT * FROM core.profiles WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row === undefined ? null : mapRow(row);
  }

  /** @inheritdoc */
  public async create(input: CreateProfileInput): Promise<Profile> {
    return this.db.transaction(async (client) => {
      if (input.isActive) {
        await client.query('UPDATE core.profiles SET is_active = false');
      }
      const result = await client.query<Record<string, unknown>>(
        `INSERT INTO core.profiles (name, cv_md, skills, preferences, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          input.name,
          input.cvMd ?? null,
          input.skills ?? [],
          JSON.stringify(input.preferences ?? {}),
          input.isActive ?? false,
        ],
      );
      const row = result.rows[0];
      if (row === undefined) {
        throw new Error('Insert unexpectedly returned no row');
      }
      return mapRow(row);
    });
  }

  /** @inheritdoc */
  public async update(id: number, input: UpdateProfileInput): Promise<Profile | null> {
    const existing = await this.findById(id);
    if (existing === null) {
      throw new NotFoundError(`Profile ${id.toString()} not found`);
    }

    return this.db.transaction(async (client) => {
      if (input.isActive) {
        await client.query('UPDATE core.profiles SET is_active = false WHERE id <> $1', [id]);
      }

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let param = 1;

      if (input.name !== undefined) {
        setClauses.push(`name = $${param}`);
        values.push(input.name);
        param += 1;
      }
      if (input.cvMd !== undefined) {
        setClauses.push(`cv_md = $${param}`);
        values.push(input.cvMd);
        param += 1;
      }
      if (input.skills !== undefined) {
        setClauses.push(`skills = $${param}`);
        values.push(input.skills);
        param += 1;
      }
      if (input.preferences !== undefined) {
        setClauses.push(`preferences = $${param}`);
        values.push(JSON.stringify(input.preferences));
        param += 1;
      }
      if (input.isActive !== undefined) {
        setClauses.push(`is_active = $${param}`);
        values.push(input.isActive);
        param += 1;
      }

      if (setClauses.length === 0) {
        return existing;
      }

      values.push(id);
      const sql = `UPDATE core.profiles SET ${setClauses.join(', ')} WHERE id = $${param} RETURNING *`;
      const result = await client.query<Record<string, unknown>>(sql, values);
      const row = result.rows[0];
      if (row === undefined) {
        throw new Error('Update unexpectedly returned no row');
      }
      return mapRow(row);
    });
  }

  /** @inheritdoc */
  public async delete(id: number): Promise<boolean> {
    const result = await this.db.query<Record<string, unknown>>(
      'DELETE FROM core.profiles WHERE id = $1 RETURNING id',
      [id],
    );
    if (result.rows.length === 0) {
      throw new NotFoundError(`Profile ${id.toString()} not found`);
    }
    return true;
  }
}
