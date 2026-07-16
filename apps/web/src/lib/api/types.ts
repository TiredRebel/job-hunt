/**
 * @module lib/api/types
 *
 * Generic helpers for pulling request/response shapes out of
 * `@job-hunter/shared-ts`'s generated `ApiOperations` map, keyed by
 * `operationId`. Resource modules (`lib/api/jobs.ts`, etc.) use these
 * instead of hand-duplicating DTO shapes.
 */
import type { ApiOperations } from '@job-hunter/shared-ts';

/** JSON response body for `operation`'s given HTTP status (default `200`). */
export type OperationResponse<
  Operation extends keyof ApiOperations,
  Status extends keyof ApiOperations[Operation]['responses'] =
    200 extends keyof ApiOperations[Operation]['responses']
      ? 200
      : keyof ApiOperations[Operation]['responses'],
> = ApiOperations[Operation]['responses'][Status] extends {
  content: { 'application/json': infer Body };
}
  ? Body
  : never;

/** JSON request body for `operation`, or `never` when it takes none. */
export type OperationBody<Operation extends keyof ApiOperations> =
  ApiOperations[Operation] extends {
    requestBody?: { content: { 'application/json': infer Body } };
  }
    ? Body
    : never;

/** Query parameters for `operation`, or `never` when it takes none. */
export type OperationQuery<Operation extends keyof ApiOperations> =
  ApiOperations[Operation]['parameters']['query'];
