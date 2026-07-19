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

/** Typed CLS store shape — gives `ClsService<AppClsStore>` a typed `get`/`set`. */
export interface AppClsStore extends ClsStore {
  correlationId: string;
}

/**
 * Resolve the correlation id for an incoming request.
 *
 * @param req - Incoming HTTP request.
 * @returns The caller's `X-Correlation-Id` value when present, otherwise a
 *   newly minted UUID.
 */
export function resolveCorrelationId(req: IncomingMessage): string {
  const header = req.headers[CORRELATION_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  return value !== undefined && value.length > 0 ? value : randomUUID();
}
