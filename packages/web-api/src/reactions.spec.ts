/**
 * @module lib/api/reactions.spec
 *
 * Contract tests for the typed reactions/board-order API client.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { addBulkReactions, addReaction, getReactionTimeline, setBoardOrder } from './reactions';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

describe('reactions API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('appends a reaction, converting profileId to a number', async () => {
    const body = { id: '1', jobId: '42', profileId: 1, reaction: 'saved' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(addReaction({ jobId: '42', profileId: '1', reaction: 'saved' })).resolves.toEqual(
      body,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reactions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ jobId: '42', profileId: 1, reaction: 'saved' }),
      }),
    );
  });

  it('bulk-sets a reaction for selected jobs', async () => {
    const body = { inserted: 2 };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      addBulkReactions({ jobIds: ['1', '2'], profileId: '1', reaction: 'applied' }),
    ).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reactions/bulk',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ jobIds: ['1', '2'], profileId: 1, reaction: 'applied' }),
      }),
    );
  });

  it('gets the reaction timeline for a job/profile pair', async () => {
    const body = [{ id: '1', jobId: '42', profileId: 1, reaction: 'saved' }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getReactionTimeline('42', '1')).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reactions/42/timeline?profileId=1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rewrites a board column order', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await setBoardOrder({ profileId: '1', stage: 'saved', jobIds: ['3', '1', '2'] });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/board/order',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ profileId: 1, stage: 'saved', jobIds: ['3', '1', '2'] }),
      }),
    );
  });
});
