/**
 * @module lib/api/jobs.spec
 *
 * Contract tests for the typed jobs API client.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteJob, deleteJobs, getJob, listJobs, setJobStatus } from './jobs';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

describe('deleteJob', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a DELETE request and returns the typed confirmation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ deleted: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteJob('42')).resolves.toEqual({ deleted: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/42',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('propagates a not-found ApiError without changing the request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'Job not found' }), { status: 404 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteJob('404')).rejects.toMatchObject({ status: 404 });
  });
});

describe('deleteJobs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a POST to bulk-delete with the job ids and returns the deleted count', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ deleted: 2 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteJobs(['1', '2'])).resolves.toEqual({ deleted: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/bulk-delete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ jobIds: ['1', '2'] }),
      }),
    );
  });
});

describe('job read and status API functions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists jobs with serialized filter parameters', async () => {
    const body = { items: [], total: 0 };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listJobs({ query: 'typescript', limit: 20 })).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs?query=typescript&limit=20',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('gets job detail by bigint-as-string id', async () => {
    const body = { id: '42', title: 'Backend Engineer' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getJob('42')).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/42',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('updates job status', async () => {
    const body = { id: '42', status: 'archived' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(setJobStatus('42', 'archived')).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/jobs/42/status',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'archived' }) }),
    );
  });
});
