/**
 * @module lib/env
 *
 * Web-app-only proxy trust flag plus re-exports of API base URL helpers from
 * `@job-hunter/web-api`.
 *
 * TODO(web-micro-frontends cutover): import `getServerApiBaseUrl` from
 * `@job-hunter/web-api/env` in the proxy route and delete these re-exports.
 */
export { getApiBaseUrl, getClientApiBaseUrl, getServerApiBaseUrl } from '@job-hunter/web-api/env';

/**
 * Whether the `/api` proxy should forward an incoming `X-Forwarded-For`
 * header to the gateway. `X-Forwarded-For` is not a forbidden `fetch()`
 * header, so a browser can set it directly on a request to this route —
 * forwarding it unconditionally would let any caller spoof the value the
 * gateway keys its rate limiter on (the exact bypass `TRUST_PROXY_HEADERS`
 * closes gateway-side). Only enable this when a trusted reverse proxy sits
 * in front of this web app itself and overwrites/strips any client-supplied
 * value before it reaches this route — mirrors the gateway's own
 * `TRUST_PROXY_HEADERS` flag and reasoning.
 *
 * @returns `true` only when `TRUST_PROXY_HEADERS` is explicitly `"true"`.
 */
export function shouldTrustIncomingProxyHeaders(): boolean {
  return process.env['TRUST_PROXY_HEADERS'] === 'true';
}
