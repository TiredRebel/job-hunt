/**
 * @module database.module
 *
 * Global database provider. Exposes a single `pg` `Pool` instance and a
 * transaction helper bound to the validated `DATABASE_URL`.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { Pool as PgPool } from 'pg';

import type { ApiConfig } from '../../config/api-config';

/**
 * Symbol used to inject the pg Pool.
 */
export const PG_POOL = Symbol('PG_POOL');

/**
 * Wrapper around `pg` providing parameterized query helpers and a simple
 * transaction runner.
 */
export class PgDatabase {
  /**
   * Database wrapper around a pg pool.
   *
   * @param pool - Underlying pg pool instance.
   */
  public constructor(private readonly pool: Pool) {}

  /**
   * Execute a single parameterized query.
   *
   * @param text - SQL text with `$1`, `$2`, ... placeholders.
   * @param values - Values to bind.
   * @returns Query result rows.
   */
  public async query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<R>> {
    return this.pool.query(text, values ?? []);
  }

  /**
   * Run a function inside a transaction. Rolls back on error.
   *
   * @param work - Function receiving a client and returning a value.
   * @returns The value returned by `work`.
   */
  public async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * End the pool when the application shuts down.
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Database module: one Pool per process, one PgDatabase wrapper.
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<ApiConfig['DATABASE_URL']>('api.DATABASE_URL');
        if (!url) {
          throw new Error('DATABASE_URL is missing from configuration');
        }
        return new PgPool({ connectionString: url });
      },
    },
    {
      provide: PgDatabase,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => new PgDatabase(pool),
    },
  ],
  exports: [PgDatabase, PG_POOL],
})
export class DatabaseModule {}
