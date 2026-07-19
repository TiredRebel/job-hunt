/**
 * @module tracker
 *
 * Client-identity resolution for `@nestjs/throttler` (design.md D5 in
 * openspec/changes/phase-7-hardening). `X-Forwarded-For` is client-supplied
 * and trivially spoofable by any direct caller, so it is only consulted
 * when `TRUST_PROXY_HEADERS` is explicitly enabled — i.e. when a trusted
 * reverse proxy sits in front and overwrites/strips any client-supplied
 * value before it reaches the gateway (see docs/DEPLOYMENT.md's production
 * topology). Otherwise this keys on the socket's own remote address, which
 * a caller cannot forge.
 *
 * Known limitation: the web app's same-origin `/api` proxy
 * (`apps/web/src/app/api/[...path]/route.ts`) does not currently forward
 * `X-Forwarded-For`, so browser traffic arriving through it is bucketed by
 * the web container's own address rather than per browser client even when
 * `TRUST_PROXY_HEADERS` is enabled. This still protects the gateway (any
 * caller, proxied or direct, is bounded), just more coarsely for that one
 * path. Next.js App Router Route Handlers have no documented client-IP
 * accessor in this version (confirmed against the bundled docs —
 * `NextRequest`/`Request` expose no `.ip`), so fixing this needs its own
 * change, not a guess grafted onto this one.
 */
import type { IncomingMessage } from 'node:http';

/**
 * Resolve the tracking key for a request.
 *
 * @param req - The incoming request.
 * @param trustProxyHeaders - Whether to trust a client-supplied
 *   `X-Forwarded-For` header. Must only be `true` behind a reverse proxy
 *   that overwrites the header itself; defaults to distrust otherwise.
 * @returns The leftmost `X-Forwarded-For` entry when trusted, otherwise the
 *   socket's remote address.
 */
export function resolveClientTracker(
  req: IncomingMessage,
  trustProxyHeaders: boolean,
): string {
  if (trustProxyHeaders) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    if (value !== undefined && value.length > 0) {
      return value.split(',')[0]?.trim() ?? value;
    }
  }
  return req.socket.remoteAddress ?? 'unknown';
}
