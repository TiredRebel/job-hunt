/**
 * @module lib/api/cover-letters
 *
 * Typed functions for `GET/PUT /jobs/{jobId}/cover-letter`.
 */
import { ApiError, apiRequest } from './client';
import type { OperationBody, OperationResponse } from './types';

/** Cover-letter draft as returned by the API. */
export type CoverLetter = OperationResponse<'CoverLettersController_get_v1'>;

/** Body accepted by {@link saveCoverLetter}. */
export type SaveCoverLetterBody = OperationBody<'CoverLettersController_save_v1'>;

/**
 * Fetch a job's cover-letter draft.
 *
 * @param jobId - Job id (bigint as string).
 * @param signal - Optional abort signal.
 * @returns The draft, or `null` when the API returns 404 (no draft yet).
 */
export async function getCoverLetter(
  jobId: string,
  signal?: AbortSignal,
): Promise<CoverLetter | null> {
  try {
    return await apiRequest<CoverLetter>(`/jobs/${jobId}/cover-letter`, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Persist an edited cover-letter body.
 *
 * @param jobId - Job id (bigint as string).
 * @param bodyMd - Edited markdown body (maps to API field `body`).
 * @returns The saved cover letter.
 */
export async function saveCoverLetter(jobId: string, bodyMd: string): Promise<CoverLetter> {
  return apiRequest<CoverLetter>(`/jobs/${jobId}/cover-letter`, {
    method: 'PUT',
    body: { body: bodyMd } satisfies SaveCoverLetterBody,
  });
}

/**
 * Regenerate a job's cover-letter draft via the LLM service. Requires a
 * persisted match for the job (404 otherwise).
 *
 * @param jobId - Job id (bigint as string).
 * @returns The regenerated (and persisted) draft.
 */
export async function regenerateCoverLetter(jobId: string): Promise<CoverLetter> {
  return apiRequest<CoverLetter>(`/jobs/${jobId}/cover-letter/regenerate`, { method: 'POST' });
}
