/**
 * @module lib/api/dictionaries
 *
 * Typed functions for the `/keyword-dictionaries` resource, keyed by
 * `slug` (no numeric id involved).
 */
import { apiRequest } from './client';
import type { OperationBody, OperationResponse } from './types';

/** A keyword dictionary, as returned by the API. */
export type KeywordDictionary = OperationResponse<'KeywordDictionariesController_get_v1'>;

/** Dictionary kind from the dictionary response (not the optional list query). */
export type DictionaryKind = KeywordDictionary['kind'];

/** Body accepted by {@link createDictionary}. */
export type CreateDictionaryBody = OperationBody<'KeywordDictionariesController_create_v1'>;

/** Body accepted by {@link updateDictionary}. */
export type UpdateDictionaryBody = OperationBody<'KeywordDictionariesController_update_v1'>;

/**
 * List all dictionaries, optionally filtered by kind.
 *
 * @param kind - Optional kind filter.
 * @param signal - Optional abort signal.
 * @returns The matching dictionaries.
 */
export async function listDictionaries(
  kind?: DictionaryKind,
  signal?: AbortSignal,
): Promise<readonly KeywordDictionary[]> {
  return apiRequest<readonly KeywordDictionary[]>('/keyword-dictionaries', {
    query: { kind },
    signal,
  });
}

/**
 * Get a dictionary by slug.
 *
 * @param slug - Dictionary slug.
 * @param signal - Optional abort signal.
 * @returns The dictionary.
 */
export async function getDictionary(
  slug: string,
  signal?: AbortSignal,
): Promise<KeywordDictionary> {
  return apiRequest<KeywordDictionary>(`/keyword-dictionaries/${slug}`, { signal });
}

/**
 * Create a dictionary.
 *
 * @param body - Dictionary data.
 * @returns The created dictionary.
 */
export async function createDictionary(body: CreateDictionaryBody): Promise<KeywordDictionary> {
  return apiRequest<KeywordDictionary>('/keyword-dictionaries', { method: 'POST', body });
}

/**
 * Update a dictionary.
 *
 * @param slug - Dictionary slug.
 * @param body - Partial update.
 * @returns The updated dictionary.
 */
export async function updateDictionary(
  slug: string,
  body: UpdateDictionaryBody,
): Promise<KeywordDictionary> {
  return apiRequest<KeywordDictionary>(`/keyword-dictionaries/${slug}`, { method: 'PATCH', body });
}

/**
 * Delete a dictionary.
 *
 * @param slug - Dictionary slug.
 * @returns Whether a dictionary was deleted.
 */
export async function deleteDictionary(slug: string): Promise<boolean> {
  const result = await apiRequest<{ deleted: boolean }>(`/keyword-dictionaries/${slug}`, {
    method: 'DELETE',
  });
  return result.deleted;
}
