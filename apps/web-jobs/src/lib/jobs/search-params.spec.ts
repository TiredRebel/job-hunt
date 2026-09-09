/**
 * @module lib/jobs/search-params.spec
 *
 * Unit tests for `/jobs` URL filter parse/serialize round-trips.
 */
import { describe, expect, it } from 'vitest';

import {
  countActiveFilters,
  jobsListParamsToSearchParams,
  parseJobsSearchParams,
} from './search-params';

describe('parseJobsSearchParams', () => {
  it('parses comma-joined multi-values and ISO dates', () => {
    const params = parseJobsSearchParams({
      sources: '1,3',
      reaction: 'saved,applied',
      scoreMin: '60',
      dateField: 'posted',
      dateFrom: '2026-07-01T00:00:00.000Z',
      dateTo: '2026-07-08T00:00:00.000Z',
      query: 'typescript',
      sortBy: 'score',
      sortDir: 'asc',
    });

    expect(params.sources).toEqual(['1', '3']);
    expect(params.reaction).toEqual(['saved', 'applied']);
    expect(params.scoreMin).toBe(60);
    expect(params.dateField).toBe('posted');
    expect(params.dateFrom?.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(params.dateTo?.toISOString()).toBe('2026-07-08T00:00:00.000Z');
    expect(params.query).toBe('typescript');
    expect(params.sortBy).toBe('score');
    expect(params.sortDir).toBe('asc');
  });

  it('ignores invalid enum values', () => {
    const params = parseJobsSearchParams({
      dateField: 'bogus',
      sortBy: 'title',
      sortDir: 'sideways',
    });
    expect(params.dateField).toBeUndefined();
    expect(params.sortBy).toBeUndefined();
    expect(params.sortDir).toBeUndefined();
  });
});

describe('jobsListParamsToSearchParams', () => {
  it('round-trips active filters without defaults', () => {
    const original = parseJobsSearchParams({
      sources: '2',
      scoreMin: '40',
      query: 'react',
      sortBy: 'salary',
      sortDir: 'desc',
    });
    const serialized = jobsListParamsToSearchParams(original);
    const roundTripped = parseJobsSearchParams(Object.fromEntries(serialized.entries()));

    expect(roundTripped.sources).toEqual(original.sources);
    expect(roundTripped.scoreMin).toBe(original.scoreMin);
    expect(roundTripped.query).toBe(original.query);
    expect(roundTripped.sortBy).toBe(original.sortBy);
    expect(roundTripped.sortDir).toBe(original.sortDir);
  });
});

describe('countActiveFilters', () => {
  it('ignores sort and pagination', () => {
    expect(
      countActiveFilters({
        sortBy: 'score',
        sortDir: 'asc',
        limit: 50,
        offset: 20,
      }),
    ).toBe(0);
  });

  it('counts user-set filters', () => {
    expect(
      countActiveFilters({
        query: 'go',
        scoreMin: 60,
        reaction: ['saved'],
      }),
    ).toBe(3);
  });
});
