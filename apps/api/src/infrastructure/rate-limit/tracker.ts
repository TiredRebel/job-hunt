/**
 * @module tracker
 *
 * Client-identity resolution for `@nestjs/throttler` (design.md D5 in
 * openspec/changes/phase-7-hardening). Prefers `X-Forwarded-For`'s leftmost
 * entry (the original client, when a real reverse proxy sits in front —
 * see docs/DEPLOYMENT.md's production topology), falling back to the
 * socket's own remote address.
 *
 * Known limitation: the web app's same-origin `/api` proxy
 * (`apps/web/src/app/api/[...path]/route.ts`) does not currently forward
 * `X-Forwarded-For`, so browser traffic arriving through it is bucketed by
 * the web container's own address rather than per browser client. This
 * still protects the gateway (any caller, proxied or direct, is bounded),
 * just more coarsely for that one path. Next.js App Router Route Handlers
 * have no documented client-IP accessor in this version (confirmed against
 * the bundled docs — `NextRequest`/`Request` expose no `.ip`), so fixing
 * this needs its own change, not a guess grafted onto this one.
 */
import type { IncomingMessage } from 'node:http';

/**
 * Resolve the tracking key for a request.
 *
 * @param req - The incoming request.
 * @returns The leftmost `X-Forwarded-For` entry, or the socket's remote
 *   address when the header is absent.
 */
export function resolveClientTracker(req: IncomingMessage): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  if (value !== undefined && value.length > 0) {
    return value.split(',')[0]?.trim() ?? value;
  }
  return req.socket.remoteAddress ?? 'unknown';
}
