/**
 * @module postgres-job.repository.spec
 *
 * Query-shape regression tests for Jobs list ordering. The infrastructure
 * adapter is intentionally tested with a capture-only database: these tests
 * protect the generated SQL contract without requiring a running Postgres
 * instance.
 */
import type { QueryResult, QueryResultRow } from 'pg';
import { describe, expect, it } from 'vitest';

import { PgDatabase } from '../database/database.module';
import { PostgresJobRepository } from './postgres-job.repository';

interface QueryCall {
  readonly text: string;
  readonly values: readonly unknown[];
}

interface JobRow extends QueryResultRow {
  readonly id: number;
  readonly source_id: number;
  readonly source_slug: string;
  readonly external_id: string;
  readonly url: string;
  readonly title: string;
  readonly posted_at: string | null;
  readonly first_seen_at: string;
  readonly last_seen_at: string;
  readonly status: 'new';
}

/**
 * Sentinel metric counts returned alongside `total` by the fake count query.
 * Distinct non-zero values so a repository that dropped them would surface
 * zeros and fail loudly.
 */
const COUNT_METRICS = { highFit: 7, inMotion: 3, unreviewed: 11 } as const;

/** Build the minimal database shape consumed by {@link PostgresJobRepository}. */
class CaptureDatabase {
  public readonly calls: QueryCall[] = [];

  /** Make the count query return no row, exercising the zero fallbacks. */
  public emptyCount = false;

  public constructor(
    private readonly rowsByOffset: ReadonlyMap<number, readonly JobRow[]> = new Map(),
  ) {}

  public query<R extends QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<R>> {
    this.calls.push({ text, values });
    const rows = text.includes('COUNT(*)::int AS total')
      ? ((this.emptyCount
          ? []
          : [
              { total: [...this.rowsByOffset.values()].flat().length, ...COUNT_METRICS },
            ]) as unknown as R[])
      : ([...(this.rowsByOffset.get(Number(values.at(-1))) ?? [])] as unknown as R[]);
    return Promise.resolve({ rows } as QueryResult<R>);
  }
}

function makeRow(id: number, postedAt: string | null, firstSeenAt: string): JobRow {
  return {
    id,
    source_id: 1,
    source_slug: 'workua',
    external_id: `job-${id}`,
    url: `https://example.test/jobs/${id}`,
    title: `Job ${id}`,
    posted_at: postedAt,
    first_seen_at: firstSeenAt,
    last_seen_at: firstSeenAt,
    status: 'new',
  };
}

function asRepository(database: CaptureDatabase): PostgresJobRepository {
  return new PostgresJobRepository(database as unknown as PgDatabase);
}

describe('PostgresJobRepository Posted ordering', () => {
  it("orders Posted by the table's effective display date and a stable id key", async () => {
    const database = new CaptureDatabase();

    await asRepository(database).findMany({
      limit: 20,
      offset: 0,
      sortBy: 'posted',
      sortDir: 'desc',
    });

    const pageQuery = database.calls[1];
    expect(pageQuery?.text).toContain(
      'ORDER BY COALESCE(j.posted_at, j.first_seen_at) DESC NULLS LAST, j.id DESC',
    );
  });

  it('keeps other sort expressions unchanged', async () => {
    const database = new CaptureDatabase();

    await asRepository(database).findMany({
      limit: 20,
      offset: 0,
      sortBy: 'score',
      sortDir: 'asc',
    });

    const pageQuery = database.calls[1];
    expect(pageQuery?.text).toContain('ORDER BY matches.score ASC NULLS LAST, j.id DESC');
    expect(pageQuery?.text).not.toContain('COALESCE(j.posted_at, j.first_seen_at)');
  });

  it('uses the same unique tie-breaker for ascending Posted order', async () => {
    const database = new CaptureDatabase();

    await asRepository(database).findMany({
      limit: 20,
      offset: 0,
      sortBy: 'posted',
      sortDir: 'asc',
    });

    const pageQuery = database.calls[1];
    expect(pageQuery?.text).toContain(
      'ORDER BY COALESCE(j.posted_at, j.first_seen_at) ASC NULLS LAST, j.id DESC',
    );
  });

  it('preserves the effective Posted sequence over consecutive offsets', async () => {
    const database = new CaptureDatabase(
      new Map([
        [
          0,
          [
            makeRow(40, null, '2026-08-06T09:00:00.000Z'),
            makeRow(35, '2026-08-06T00:00:00.000Z', '2026-08-06T08:00:00.000Z'),
          ],
        ],
        [
          2,
          [
            makeRow(30, '2026-08-05T00:00:00.000Z', '2026-08-05T08:00:00.000Z'),
            makeRow(20, '2026-07-28T00:00:00.000Z', '2026-07-28T08:00:00.000Z'),
          ],
        ],
      ]),
    );
    const repository = asRepository(database);

    const [firstPage, secondPage] = await Promise.all([
      repository.findMany({ limit: 2, offset: 0, sortBy: 'posted', sortDir: 'desc' }),
      repository.findMany({ limit: 2, offset: 2, sortBy: 'posted', sortDir: 'desc' }),
    ]);
    const jobs = [...firstPage.items, ...secondPage.items];
    const effectiveDates = jobs.map((job) => job.postedAt ?? job.firstSeenAt);

    expect(jobs.map((job) => job.id)).toEqual([40n, 35n, 30n, 20n]);
    expect(new Set(jobs.map((job) => job.id)).size).toBe(jobs.length);
    expect(effectiveDates.map((date) => date.toISOString().slice(0, 10))).toEqual([
      '2026-08-06',
      '2026-08-06',
      '2026-08-05',
      '2026-07-28',
    ]);
  });
});

describe('PostgresJobRepository dashboard metric counts', () => {
  it('derives the metrics from the same count query, so they share the filter scope', async () => {
    const database = new CaptureDatabase();

    const result = await asRepository(database).findMany({ limit: 20, offset: 0 });

    // One query for all four numbers — a second query could observe a
    // different snapshot and reintroduce the mixed-scope reporting bug.
    const countQuery = database.calls[0];
    expect(countQuery?.text).toContain('COUNT(*)::int AS total');
    expect(countQuery?.text).toContain('COALESCE(matches.score, 0) >= 80');
    expect(countQuery?.text).toContain(
      "current_reaction.reaction IN ('applied', 'interview', 'offer')",
    );
    expect(countQuery?.text).toContain('current_reaction.reaction IS NULL');
    expect(database.calls).toHaveLength(2);

    expect({
      highFit: result.highFit,
      inMotion: result.inMotion,
      unreviewed: result.unreviewed,
    }).toEqual(COUNT_METRICS);
  });

  it('double-quotes the camelCase aliases so Postgres does not fold them to lowercase', async () => {
    const database = new CaptureDatabase();

    await asRepository(database).findMany({ limit: 20, offset: 0 });

    // Unquoted, `AS highFit` comes back as `highfit` and every metric
    // silently reads as 0.
    expect(database.calls[0]?.text).toContain('AS "highFit"');
    expect(database.calls[0]?.text).toContain('AS "inMotion"');
  });

  it('falls back to zero when the count query returns no row', async () => {
    const database = new CaptureDatabase();
    database.emptyCount = true;

    const result = await asRepository(database).findMany({ limit: 20, offset: 0 });

    expect({ total: result.total, highFit: result.highFit }).toEqual({ total: 0, highFit: 0 });
  });
});

describe('PostgresJobRepository default sort and search scope', () => {
  it('orders by effective posted date when no sort is requested', async () => {
    const database = new CaptureDatabase();

    await asRepository(database).findMany({ limit: 20, offset: 0 });

    expect(database.calls[1]?.text).toContain(
      'ORDER BY COALESCE(j.posted_at, j.first_seen_at) DESC NULLS LAST, j.id DESC',
    );
    expect(database.calls[1]?.text).not.toContain('ORDER BY j.last_seen_at');
  });

  it('searches role identity only, never the job description', async () => {
    const database = new CaptureDatabase();

    await asRepository(database).findMany({ limit: 20, offset: 0, query: 'QA' });

    // Every posting body name-drops the whole team, so matching on
    // description_md made "QA" return every backend role.
    const [countQuery, pageQuery] = database.calls;
    for (const call of [countQuery, pageQuery]) {
      expect(call?.text).toContain(
        "to_tsvector('simple', COALESCE(j.title, '') || ' ' || COALESCE(j.company, '') || ' ' || COALESCE(j.summary, '')) @@ websearch_to_tsquery('simple', $1)",
      );
      expect(call?.text).not.toContain('COALESCE(j.description_md');
    }
    expect(countQuery?.values).toEqual(['QA']);
  });

  it('ignores a blank query instead of matching everything', async () => {
    const database = new CaptureDatabase();

    await asRepository(database).findMany({ limit: 20, offset: 0, query: '   ' });

    expect(database.calls[0]?.text).not.toContain('websearch_to_tsquery');
  });
});
