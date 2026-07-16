/**
 * @module lib/api/client
 *
 * Minimal typed fetch wrapper around the API gateway. Resource-specific
 * functions (`lib/api/jobs.ts`, etc.) supply their own request/response
 * types drawn from `@job-hunter/shared-ts`'s generated `ApiOperations`; this
 * module only owns URL/query building, error normalization, and JSON
 * (de)serialization. docs/UI_DESIGN.md / design.md "API client layer".
 */
import { getApiBaseUrl } from '@/lib/env';

/** A single query parameter value accepted by {@link buildQueryString}. */
export type QueryValue =
  string | number | boolean | Date | readonly (string | number)[] | undefined | null;

/** Query parameter bag accepted by {@link apiRequest}. */
export type QueryParams = Record<string, QueryValue>;

/** HTTP method supported by {@link apiRequest}. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Options accepted by {@link apiRequest}. */
export interface ApiRequestOptions {
  readonly method?: HttpMethod;
  readonly query?: QueryParams;
  readonly body?: unknown;
  // Explicitly allows `undefined` (not just omission) so callers can forward
  // an optional `AbortSignal` parameter without exactOptionalPropertyTypes friction.
  readonly signal?: AbortSignal | undefined;
}

/**
 * Serialize a single query value. Arrays are comma-joined (matching the API
 * gateway's CSV-style filter params); `Date` instances are serialized as
 * ISO 8601 strings; `undefined`/`null` are omitted by the caller.
 *
 * @param value - The value to serialize.
 * @returns The string form sent on the wire.
 */
function serializeQueryValue(
  value: string | number | boolean | Date | readonly (string | number)[],
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return String(value);
}

/**
 * Build a `?`-prefixed query string from a param bag, omitting `undefined`,
 * `null`, and empty-array entries.
 *
 * @param query - Query parameters, or `undefined` for none.
 * @returns The query string including its leading `?`, or `''` when empty.
 */
export function buildQueryString(query: QueryParams | undefined): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    params.set(key, serializeQueryValue(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * Build a full request URL from a base URL, a path (already interpolated
 * with any path params), and an optional query bag.
 *
 * @param baseUrl - API base URL, e.g. `http://localhost:4000/v1`.
 * @param path - Path relative to `baseUrl`, e.g. `/jobs/42`.
 * @param query - Optional query parameters.
 * @returns The full request URL.
 */
export function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}${buildQueryString(query)}`;
}

/**
 * Error thrown by {@link apiRequest} for non-2xx responses. Carries the
 * parsed response body (if any) so callers can surface API-provided error
 * details (e.g. NestJS's `{ message, statusCode }` shape).
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  /**
   * Construct an {@link ApiError}.
   *
   * @param status - HTTP status code of the failed response.
   * @param body - Parsed response body, if any.
   * @param message - Human-readable message, derived from `body` when omitted.
   */
  public constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Extract a human-readable message from a NestJS-style error body, if
 * present.
 *
 * @param body - Parsed response body.
 * @returns The extracted message, or `undefined`.
 */
function extractErrorMessage(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown };
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) {
      return message.join(', ');
    }
  }
  return undefined;
}

/**
 * Perform a JSON request against the API gateway, resolving with the parsed
 * response body typed as `TResponse`.
 *
 * @typeParam TResponse - Expected response body shape (supplied by the
 *   caller, typically derived from `ApiOperations`).
 * @param path - Path relative to the resolved base URL, e.g. `/jobs/42`.
 * @param options - Method, query params, body, and abort signal.
 * @returns The parsed JSON response body.
 * @throws {ApiError} When the response status is not in the 2xx range.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { method = 'GET', query, body, signal } = options;
  const url = buildUrl(getApiBaseUrl(), path, query);

  const init: RequestInit = {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    ...(signal ? { signal } : {}),
  };

  const response = await fetch(url, init);

  const rawBody = await response.text();
  const parsedBody: unknown = rawBody ? JSON.parse(rawBody) : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, parsedBody, extractErrorMessage(parsedBody));
  }

  return parsedBody as TResponse;
}
