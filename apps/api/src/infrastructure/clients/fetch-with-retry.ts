/**
 * @module fetch-with-retry
 *
 * Bounded exponential-backoff retry for safe/idempotent downstream HTTP
 * calls (request-resilience spec; design.md D6 in
 * openspec/changes/phase-7-hardening). Retries on network errors, HTTP 5xx,
 * and HTTP 429 (honoring `Retry-After` when present); any other non-2xx
 * response is returned immediately, unretried, for the caller to inspect —
 * matching this codebase's existing client pattern of checking
 * `response.ok` after the call rather than throwing here.
 */
import type { Logger } from 'nestjs-pino';

/**
 * Upper bound on any single backoff delay, including a server-requested
 * `Retry-After`. Without this cap a malicious or misconfigured downstream
 * could return an arbitrarily large `Retry-After` (or a far-future HTTP
 * date) and tie up the caller for an unbounded duration — a self-inflicted
 * denial of service.
 */
const MAX_DELAY_MS = 30_000;

/** Options controlling one {@link fetchWithRetry} call. */
export interface FetchWithRetryOptions {
  /** Maximum number of attempts, including the first (>= 1). */
  readonly maxAttempts: number;
  /** Base delay in milliseconds for exponential backoff (default 200). */
  readonly baseDelayMs?: number;
  /** Human-readable target name for the retry warning log line. */
  readonly target: string;
  /** Logger a retry is reported on; omitted in contexts with none available. */
  readonly logger?: Pick<Logger, 'warn'>;
}

/**
 * Whether an HTTP status is a transient failure worth retrying.
 *
 * @param status - The response's HTTP status code.
 * @returns `true` for 429 or any 5xx status.
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Parse a `Retry-After` header into a millisecond delay.
 *
 * @param response - The response carrying the header.
 * @returns The requested delay in milliseconds (capped at
 *   {@link MAX_DELAY_MS}), or `null` if absent/unparseable.
 */
function parseRetryAfterMs(response: Response): number | null {
  const header = response.headers.get('retry-after');
  if (header === null) {
    return null;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return Math.min(Math.max(0, seconds * 1000), MAX_DELAY_MS);
  }
  const dateMs = Date.parse(header);
  return Number.isNaN(dateMs) ? null : Math.min(Math.max(0, dateMs - Date.now()), MAX_DELAY_MS);
}

/**
 * Compute the backoff delay before the next attempt.
 *
 * @param attempt - The attempt number that just failed (1-based).
 * @param baseDelayMs - Base delay for exponential backoff.
 * @param retryAfterMs - A server-requested delay, when present (already
 *   capped at {@link MAX_DELAY_MS} by {@link parseRetryAfterMs}); takes
 *   precedence over the computed exponential delay.
 * @returns Milliseconds to wait before the next attempt, capped at
 *   {@link MAX_DELAY_MS}.
 */
function backoffDelayMs(attempt: number, baseDelayMs: number, retryAfterMs: number | null): number {
  if (retryAfterMs !== null) {
    return retryAfterMs;
  }
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exponential + jitter, MAX_DELAY_MS);
}

/**
 * Await `ms` milliseconds.
 *
 * @param ms - Milliseconds to wait.
 */
async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Fetch `url`, retrying transient failures with bounded exponential backoff.
 *
 * @param url - The request URL.
 * @param init - Standard `fetch` request init.
 * @param options - Retry configuration.
 * @returns The final response — either a success, a non-retryable failure
 *   returned as-is, or the last attempt's response after exhausting retries.
 * @throws The last network error if every attempt fails to connect at all.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: FetchWithRetryOptions,
): Promise<Response> {
  const baseDelayMs = options.baseDelayMs ?? 200;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if (attempt === options.maxAttempts) {
        throw error;
      }
      const reason = error instanceof Error ? error.message : String(error);
      options.logger?.warn(
        `Retrying ${options.target} after network error (attempt ${String(attempt)}/${String(options.maxAttempts)}): ${reason}`,
      );
      await delay(backoffDelayMs(attempt, baseDelayMs, null));
      continue;
    }

    if (response.ok || !isRetryableStatus(response.status) || attempt === options.maxAttempts) {
      return response;
    }

    options.logger?.warn(
      `Retrying ${options.target} after HTTP ${String(response.status)} (attempt ${String(attempt)}/${String(options.maxAttempts)})`,
    );
    await delay(backoffDelayMs(attempt, baseDelayMs, parseRetryAfterMs(response)));
  }

  // Unreachable: the loop always returns or throws by the final attempt
  // (maxAttempts >= 1 guarantees at least one iteration reaches the return
  // or throw above). Satisfies the compiler's control-flow analysis.
  throw new Error('fetchWithRetry: exhausted attempts without a result');
}
