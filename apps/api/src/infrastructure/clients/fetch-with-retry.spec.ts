/**
 * @module fetch-with-retry.spec
 *
 * Proves the retry contract (request-resilience spec; design.md D6 in
 * openspec/changes/phase-7-hardening): transient failures (network error,
 * 5xx, 429) are retried with backoff; non-transient failures are not;
 * retries are bounded; each retry is logged.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithRetry } from './fetch-with-retry';

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('fetchWithRetry', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('returns the first response when it is already ok', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200));

    const response = await fetchWithRetry(
      'https://example.com',
      {},
      { maxAttempts: 3, target: 'test' },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a transient 503 and returns the eventual success', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));

    const response = await fetchWithRetry(
      'https://example.com',
      {},
      { maxAttempts: 5, baseDelayMs: 1, target: 'test' },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a 429 with Retry-After honored', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, { status: 429, headers: { 'Retry-After': '0' } }),
      )
      .mockResolvedValueOnce(jsonResponse(200));

    const response = await fetchWithRetry(
      'https://example.com',
      {},
      { maxAttempts: 5, baseDelayMs: 1, target: 'test' },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-transient 4xx', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404));

    const response = await fetchWithRetry(
      'https://example.com',
      {},
      { maxAttempts: 5, baseDelayMs: 1, target: 'test' },
    );

    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after the configured max attempts, returning the last response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(503));

    const response = await fetchWithRetry(
      'https://example.com',
      {},
      { maxAttempts: 3, baseDelayMs: 1, target: 'test' },
    );

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a network error then succeeds', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('network error'))
      .mockResolvedValueOnce(jsonResponse(200));

    const response = await fetchWithRetry(
      'https://example.com',
      {},
      { maxAttempts: 5, baseDelayMs: 1, target: 'test' },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rethrows the last network error after exhausting attempts', async () => {
    fetchMock.mockRejectedValue(new TypeError('always down'));

    await expect(
      fetchWithRetry('https://example.com', {}, { maxAttempts: 2, baseDelayMs: 1, target: 'test' }),
    ).rejects.toThrow('always down');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('logs a warning on each retry, naming the target and attempt number', async () => {
    const warn = vi.fn();
    fetchMock.mockResolvedValueOnce(jsonResponse(503)).mockResolvedValueOnce(jsonResponse(200));

    await fetchWithRetry(
      'https://example.com',
      {},
      { maxAttempts: 3, baseDelayMs: 1, target: 'my-target', logger: { warn } },
    );

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0] as string).toContain('my-target');
    expect(warn.mock.calls[0]?.[0] as string).toContain('attempt 1');
  });
});
