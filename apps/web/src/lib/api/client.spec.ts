import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest, buildQueryString, buildUrl } from './client';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

describe('buildQueryString', () => {
  it('returns an empty string for undefined or empty params', () => {
    expect(buildQueryString(undefined)).toBe('');
    expect(buildQueryString({})).toBe('');
  });

  it('omits undefined, null, and empty-array entries', () => {
    expect(buildQueryString({ a: undefined, b: null, c: [] })).toBe('');
  });

  it('comma-joins array values', () => {
    expect(buildQueryString({ sources: ['1', '3', '7'] })).toBe('?sources=1%2C3%2C7');
    expect(buildQueryString({ scores: [10, 20] })).toBe('?scores=10%2C20');
  });

  it('serializes Date values as ISO 8601 strings', () => {
    const date = new Date('2026-01-15T00:00:00.000Z');
    expect(buildQueryString({ dateFrom: date })).toBe(
      `?dateFrom=${encodeURIComponent(date.toISOString())}`,
    );
  });

  it('serializes numbers and booleans as strings', () => {
    expect(buildQueryString({ limit: 20, enabled: true })).toBe('?limit=20&enabled=true');
  });

  it('combines multiple params in a single query string', () => {
    expect(buildQueryString({ query: 'nestjs', limit: 20, offset: 0 })).toBe(
      '?query=nestjs&limit=20&offset=0',
    );
  });
});

describe('buildUrl', () => {
  it('joins base URL and path without double slashes', () => {
    expect(buildUrl('http://localhost:4000/v1', '/jobs')).toBe('http://localhost:4000/v1/jobs');
    expect(buildUrl('http://localhost:4000/v1/', '/jobs')).toBe('http://localhost:4000/v1/jobs');
    expect(buildUrl('http://localhost:4000/v1', 'jobs')).toBe('http://localhost:4000/v1/jobs');
  });

  it('appends the query string when params are given', () => {
    expect(buildUrl('http://localhost:4000/v1', '/jobs', { limit: 20 })).toBe(
      'http://localhost:4000/v1/jobs?limit=20',
    );
  });
});

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a successful JSON response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: '1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiRequest<{ id: string }>('/jobs/1');

    expect(result).toEqual({ id: '1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends a JSON body and Content-Type header when a body is given', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/jobs/1/status', { method: 'PATCH', body: { status: 'archived' } });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'archived' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('resolves with undefined for an empty response body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiRequest('/jobs/1');

    expect(result).toBeUndefined();
  });

  it('throws ApiError with the parsed body on a non-2xx response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'Job not found', statusCode: 404 }), {
          status: 404,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/jobs/999')).rejects.toMatchObject({
      status: 404,
      message: 'Job not found',
      body: { message: 'Job not found', statusCode: 404 },
    });
  });

  it('joins array message entries when raising ApiError', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: ['field a is required', 'field b is required'] }), {
          status: 400,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/jobs')).rejects.toMatchObject({
      message: 'field a is required, field b is required',
    });
  });
});
