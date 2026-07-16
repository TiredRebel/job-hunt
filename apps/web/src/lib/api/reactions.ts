/**
 * @module lib/api/reactions
 *
 * Typed functions for the `/reactions` resource. Ids stay `string`
 * everywhere on the web side; `profileId` is converted to a number only at
 * the JSON-body boundary, matching the API's numeric profile id contract.
 */
import { apiRequest } from './client';
import type { OperationResponse } from './types';

/** Reaction event, as returned by `add`/`timeline`. */
export type ReactionEvent = OperationResponse<'ReactionsController_add_v1'>;

/** Count of rows inserted by a bulk mutation. */
export type BulkInserted = OperationResponse<'ReactionsController_addBulk_v1'>;

/** Reaction value accepted by {@link addReaction}/{@link addBulkReactions}. */
export type ReactionKind = ReactionEvent['reaction'];

/** Params accepted by {@link addReaction}. */
export interface AddReactionParams {
  readonly jobId: string;
  readonly profileId: string;
  readonly reaction: ReactionKind;
  readonly note?: string;
  readonly occurredAt?: Date;
}

/** Params accepted by {@link addBulkReactions}. */
export interface AddBulkReactionsParams {
  readonly jobIds: readonly string[];
  readonly profileId: string;
  readonly reaction: ReactionKind;
  readonly note?: string;
  readonly occurredAt?: Date;
}

/**
 * Append a reaction to a job.
 *
 * @param params - Reaction data.
 * @returns The created reaction event.
 */
export async function addReaction(params: AddReactionParams): Promise<ReactionEvent> {
  return apiRequest<ReactionEvent>('/reactions', {
    method: 'POST',
    body: { ...params, profileId: Number(params.profileId) },
  });
}

/**
 * Bulk-set a reaction for selected jobs.
 *
 * @param params - Bulk reaction data.
 * @returns The number of rows inserted.
 */
export async function addBulkReactions(params: AddBulkReactionsParams): Promise<BulkInserted> {
  return apiRequest<BulkInserted>('/reactions/bulk', {
    method: 'POST',
    body: { ...params, profileId: Number(params.profileId) },
  });
}

/**
 * Get the reaction timeline for a job/profile pair.
 *
 * @param jobId - Job id (bigint as string).
 * @param profileId - Profile id.
 * @param signal - Optional abort signal.
 * @returns The reaction events, newest first.
 */
export async function getReactionTimeline(
  jobId: string,
  profileId: string,
  signal?: AbortSignal,
): Promise<readonly ReactionEvent[]> {
  return apiRequest<readonly ReactionEvent[]>(`/reactions/${jobId}/timeline`, {
    query: { profileId },
    signal,
  });
}
