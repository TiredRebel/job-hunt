import { afterEach, describe, expect, it, vi } from 'vitest';

import { getJobsReconciliation, getSourceReconciliation } from './reconciliation';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

const SOURCE_ROW = {
  sourceId: 1,
  sourceSlug: 'dou',
  rawTotal: 10,
  processed: 7,
  pending: 2,
  failed: 1,
  visibleJobs: 6,
  hiddenJobs: 1,
};

const AGGREGATE = {
  rawTotal: 10,
  processed: 7,
  pending: 2,
  failed: 1,
  visibleJobs: 6,
  hiddenJobs: 1,
  legacyDelta: 0,
};

describe('getSourceReconciliation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs the per-source endpoint and returns the rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([SOURCE_ROW]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getSourceReconciliation();

    expect(result).toEqual([SOURCE_ROW]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reconciliation/sources',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('propagates ApiError on a 502 (database unreachable)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'db down' }), { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getSourceReconciliation()).rejects.toMatchObject({ status: 502 });
  });

  it('forwards an abort signal when provided', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([SOURCE_ROW]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await getSourceReconciliation(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reconciliation/sources',
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

describe('getJobsReconciliation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs the aggregate endpoint and returns the object', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(AGGREGATE), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getJobsReconciliation();

    expect(result).toEqual(AGGREGATE);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/reconciliation/jobs',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('propagates ApiError on a 502', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'db down' }), { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getJobsReconciliation()).rejects.toMatchObject({ status: 502 });
  });
});
