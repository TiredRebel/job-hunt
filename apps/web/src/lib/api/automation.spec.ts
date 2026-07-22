/**
 * @module lib/api/automation.spec
 *
 * Contract test for the dead-letter listing client.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listDeadLetterJobs } from './automation';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

describe('listDeadLetterJobs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists dead-lettered jobs with the default limit', async () => {
    const body = [{ id: 1, sourceId: 1, sourceSlug: 'dou', externalId: 'ext-1' }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listDeadLetterJobs()).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reconciliation/dead-letter?limit=50',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('forwards a custom limit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await listDeadLetterJobs(10);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reconciliation/dead-letter?limit=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
