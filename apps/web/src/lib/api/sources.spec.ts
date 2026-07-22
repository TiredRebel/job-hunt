import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSource,
  getSource,
  getSourceRuns,
  listAdapters,
  listSources,
  setSourceEnabled,
  testSource,
  triggerScrape,
  updateSource,
} from './sources';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

const SOURCE_BODY = {
  id: 1,
  slug: 'djinni',
  name: 'Djinni',
  baseUrl: 'https://djinni.co',
  enabled: true,
  fetchStrategy: 'crawl4ai',
  config: {},
  createdAt: '2026-07-17T00:00:00.000Z',
  updatedAt: '2026-07-17T00:00:00.000Z',
};

describe('listSources', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs all sources', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([SOURCE_BODY]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listSources()).resolves.toEqual([SOURCE_BODY]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('getSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs a source by slug', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(SOURCE_BODY), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getSource('djinni')).resolves.toEqual(SOURCE_BODY);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/djinni',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('setSourceEnabled', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PATCHes the enabled flag', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...SOURCE_BODY, enabled: false }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await setSourceEnabled('djinni', false);
    expect(result.enabled).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/djinni/enabled',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ enabled: false }) }),
    );
  });
});

describe('triggerScrape', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to trigger a scrape run', async () => {
    const body = { id: '12', sourceId: 1, sourceSlug: 'djinni', status: 'running' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(triggerScrape('djinni')).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/djinni/scrape',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('getSourceRuns', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs run history with pagination params', async () => {
    const body = [{ id: '1', sourceId: 1, sourceSlug: 'djinni', status: 'success' }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getSourceRuns('djinni', { limit: 10, offset: 0 })).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/djinni/runs?limit=10&offset=0',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('defaults to no pagination params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await getSourceRuns('djinni');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/djinni/runs',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('createSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the new source and returns it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(SOURCE_BODY), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await createSource({
      slug: 'djinni',
      name: 'Djinni',
      baseUrl: 'https://djinni.co',
      fetchStrategy: 'crawl4ai',
    });

    expect(result).toEqual(SOURCE_BODY);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('propagates ApiError on a duplicate slug (409)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Source slug 'dou' already exists" }), {
        status: 409,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createSource({
        slug: 'dou',
        name: 'DOU',
        baseUrl: 'https://jobs.dou.ua',
        fetchStrategy: 'api',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('updateSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PATCHes the changed fields and returns the updated source', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...SOURCE_BODY, baseUrl: 'https://djinni.co/jobs' }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await updateSource('djinni', { baseUrl: 'https://djinni.co/jobs' });

    expect(result.baseUrl).toBe('https://djinni.co/jobs');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/djinni',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ baseUrl: 'https://djinni.co/jobs' }),
      }),
    );
  });

  it('propagates ApiError when the source is unknown (404)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateSource('nope', { name: 'x' })).rejects.toMatchObject({ status: 404 });
  });
});

describe('testSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to the test endpoint and returns the outcome', async () => {
    const body = {
      status: 'ok',
      detail: 'fetched https://jobs.dou.ua/',
      http_status: 200,
      elapsed_ms: 42,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await testSource('dou');

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/dou/test',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('propagates ApiError when the scraper is unreachable (502)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'connect ECONNREFUSED' }), { status: 502 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(testSource('dou')).rejects.toMatchObject({ status: 502 });
  });
});

describe('listAdapters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs the adapters endpoint and unwraps the slugs array', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ slugs: ['dou', 'workua', 'jobua'] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await listAdapters();

    expect(result).toEqual(['dou', 'workua', 'jobua']);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/sources/adapters',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
