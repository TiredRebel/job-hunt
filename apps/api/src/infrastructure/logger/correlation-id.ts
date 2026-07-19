/**
 * @module correlation-id
 *
 * Shared correlation-id constants and resolution, used as the pino request
 * id, copied into CLS for the downstream HTTP clients, and forwarded by the
 * web app's `/api` proxy (see design.md D1/D2 in
 * openspec/changes/phase-7-hardening).
 */
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import type { ClsStore } from 'nestjs-cls';

/** Header name carrying the correlation id across every service hop. */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Safe correlation-id format: bounded length, restricted to characters that
 * cannot inject a fake log line/field or forge a header when echoed back or
 * embedded in JSON logs. A client-supplied value that doesn't match this is
 * discarded in favor of a freshly minted id, rather than trusted verbatim.
 */
const VALID_CORRELATION_ID = /^[A-Za-z0-9_-]{1,128}$/;

/** Typed CLS store shape — gives `ClsService<AppClsStore>` a typed `get`/`set`. */
export interface AppClsStore extends ClsStore {
  correlationId: string;
}

/**
 * Resolve the correlation id for an incoming request.
 *
 * @param req - Incoming HTTP request.
 * @returns The caller's `X-Correlation-Id` value when present and
 *   well-formed, otherwise a newly minted UUID.
 */
export function resolveCorrelationId(req: IncomingMessage): string {
  const header = req.headers[CORRELATION_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  return value !== undefined && VALID_CORRELATION_ID.test(value) ? value : randomUUID();
}
