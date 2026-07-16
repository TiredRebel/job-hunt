import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCoverLetter, regenerateCoverLetter, saveCoverLetter } from './cover-letters';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

describe('getCoverLetter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed draft on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ bodyMd: 'Dear hiring manager...' }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getCoverLetter('42');

    expect(result).toEqual({ bodyMd: 'Dear hiring manager...' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/42/cover-letter',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns null when the API responds 404', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getCoverLetter('999');

    expect(result).toBeNull();
  });
});

describe('saveCoverLetter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PUTs the edited body and returns the saved draft', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ bodyMd: 'Edited body', edited: true }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await saveCoverLetter('42', 'Edited body');

    expect(result).toEqual({ bodyMd: 'Edited body', edited: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/42/cover-letter',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ body: 'Edited body' }),
      }),
    );
  });
});

describe('regenerateCoverLetter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to the regenerate endpoint and returns the fresh draft', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ bodyMd: 'Freshly generated body', edited: false }), {
        status: 201,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await regenerateCoverLetter('42');

    expect(result).toEqual({ bodyMd: 'Freshly generated body', edited: false });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/42/cover-letter/regenerate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('propagates ApiError when the job has no persisted match (404)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'no persisted match' }), { status: 404 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(regenerateCoverLetter('42')).rejects.toMatchObject({
      status: 404,
      message: 'no persisted match',
    });
  });

  it('propagates ApiError when the LLM service has no active provider (503)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'no active provider' }), { status: 503 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(regenerateCoverLetter('42')).rejects.toMatchObject({ status: 503 });
  });
});
