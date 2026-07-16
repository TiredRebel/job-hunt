/**
 * @module lib/api/profiles
 *
 * Typed functions for the `/profiles` resource. Ids stay `string`
 * everywhere on the web side; converted to `number` only at the request
 * boundary where the API's path param expects a numeric-looking segment.
 */
import { apiRequest } from './client';
import type { OperationBody, OperationResponse } from './types';

/** A user profile, as returned by the API. */
export type Profile = OperationResponse<'ProfilesController_get_v1'>;

/** Body accepted by {@link createProfile}. */
export type CreateProfileBody = OperationBody<'ProfilesController_create_v1'>;

/** Body accepted by {@link updateProfile}. */
export type UpdateProfileBody = OperationBody<'ProfilesController_update_v1'>;

/**
 * List all profiles.
 *
 * @param signal - Optional abort signal.
 * @returns All stored profiles.
 */
export async function listProfiles(signal?: AbortSignal): Promise<readonly Profile[]> {
  return apiRequest<readonly Profile[]>('/profiles', { signal });
}

/**
 * Get the active profile.
 *
 * @param signal - Optional abort signal.
 * @returns The active profile.
 */
export async function getActiveProfile(signal?: AbortSignal): Promise<Profile> {
  return apiRequest<Profile>('/profiles/active', { signal });
}

/**
 * Get a profile by id.
 *
 * @param id - Profile id.
 * @param signal - Optional abort signal.
 * @returns The profile.
 */
export async function getProfile(id: string, signal?: AbortSignal): Promise<Profile> {
  return apiRequest<Profile>(`/profiles/${id}`, { signal });
}

/**
 * Create a profile.
 *
 * @param body - Profile data.
 * @returns The created profile.
 */
export async function createProfile(body: CreateProfileBody): Promise<Profile> {
  return apiRequest<Profile>('/profiles', { method: 'POST', body });
}

/**
 * Update a profile.
 *
 * @param id - Profile id.
 * @param body - Partial update.
 * @returns The updated profile.
 */
export async function updateProfile(id: string, body: UpdateProfileBody): Promise<Profile> {
  return apiRequest<Profile>(`/profiles/${id}`, { method: 'PATCH', body });
}

/**
 * Delete a profile.
 *
 * @param id - Profile id.
 * @returns Whether a profile was deleted.
 */
export async function deleteProfile(id: string): Promise<boolean> {
  const result = await apiRequest<{ deleted: boolean }>(`/profiles/${id}`, { method: 'DELETE' });
  return result.deleted;
}
