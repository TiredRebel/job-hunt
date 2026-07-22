/**
 * @module lib/api/dictionaries.spec
 *
 * Contract tests for the typed keyword-dictionaries API client.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createDictionary,
  deleteDictionary,
  getDictionary,
  listDictionaries,
  updateDictionary,
  type CreateDictionaryBody,
} from './dictionaries';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

describe('dictionaries API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists all dictionaries', async () => {
    const body = [{ slug: 'search-terms', kind: 'search' }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listDictionaries()).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/keyword-dictionaries',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('lists dictionaries filtered by kind', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await listDictionaries('search');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/keyword-dictionaries?kind=search',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('gets a dictionary by slug', async () => {
    const body = { slug: 'search-terms', kind: 'search' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getDictionary('search-terms')).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/keyword-dictionaries/search-terms',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('creates a dictionary', async () => {
    const requestBody: CreateDictionaryBody = {
      slug: 'new-dict',
      name: 'New',
      kind: 'search',
      items: [],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(requestBody), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createDictionary(requestBody)).resolves.toEqual(requestBody);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/keyword-dictionaries',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(requestBody) }),
    );
  });

  it('updates a dictionary', async () => {
    const requestBody = { name: 'Renamed' };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ slug: 'search-terms', ...requestBody }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await updateDictionary('search-terms', requestBody);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/keyword-dictionaries/search-terms',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(requestBody) }),
    );
  });

  it('deletes a dictionary and returns the deleted flag', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ deleted: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteDictionary('search-terms')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/keyword-dictionaries/search-terms',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
