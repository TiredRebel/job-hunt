/**
 * @module lib/api/profiles.spec
 *
 * Contract tests for the typed profiles API client.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createProfile,
  deleteProfile,
  getActiveProfile,
  getProfile,
  listProfiles,
  updateProfile,
} from './profiles';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

describe('profiles API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists all profiles', async () => {
    const body = [{ id: 1, name: 'default' }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listProfiles()).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/profiles',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('gets the active profile', async () => {
    const body = { id: 1, name: 'default', isActive: true };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getActiveProfile()).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/profiles/active',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('gets a profile by id', async () => {
    const body = { id: 1, name: 'default' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getProfile('1')).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/profiles/1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('creates a profile', async () => {
    const requestBody = { name: 'new profile' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 2, ...requestBody }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await createProfile(requestBody);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/profiles',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(requestBody) }),
    );
  });

  it('updates a profile', async () => {
    const requestBody = { name: 'renamed' };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 1, ...requestBody }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await updateProfile('1', requestBody);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/profiles/1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(requestBody) }),
    );
  });

  it('deletes a profile and returns the deleted flag', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ deleted: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteProfile('1')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/profiles/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
