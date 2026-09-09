/**
 * @module lib/api/automation
 *
 * Typed functions for the dead-letter listing exposed publicly on the
 * reconciliation controller (`GET /v1/reconciliation/dead-letter`). The
 * automation module's own `GET /v1/automation/jobs/dead-letter` is
 * internal-token-guarded and cannot be called from a browser; the
 * reconciliation mirror is the dashboard-facing surface.
 */
import { apiRequest } from './client';
import type { OperationResponse } from './types';

/** A dead-lettered raw job (failed repeated processing attempts). */
export type DeadLetterJob = OperationResponse<'ReconciliationController_deadLetterJobs_v1'>[number];

/**
 * List dead-lettered raw jobs.
 *
 * @param limit - Maximum number of rows to return (default 50, server-capped).
 * @param signal - Optional abort signal.
 * @returns Dead-lettered raw jobs, newest first.
 */
export async function listDeadLetterJobs(
  limit = 50,
  signal?: AbortSignal,
): Promise<readonly DeadLetterJob[]> {
  return apiRequest<readonly DeadLetterJob[]>('/reconciliation/dead-letter', {
    query: { limit },
    signal,
  });
}
